from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.http import HttpResponse
from datetime import datetime

from .models import OutgoingPayment
from .serializers import OutgoingPaymentSerializer

# Optional reportlab import for PDF generation
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.graphics.barcode.qr import QrCodeWidget
    from reportlab.graphics.shapes import Drawing
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


def safe_text(text):
    """Helper function to safely escape text for ReportLab paragraphs."""
    if not text:
        return ''
    text = str(text)
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    return text


class OutgoingPaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for OutgoingPayment model"""
    serializer_class = OutgoingPaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['payment_type', 'payment_method', 'status', 'supplier']
    search_fields = ['reference', 'notes', 'supplier__name']
    ordering_fields = ['transaction_date', 'amount', 'created_at']
    ordering = ['-transaction_date', '-id']

    def get_queryset(self):
        return OutgoingPayment.objects.filter(user=self.request.user).select_related('supplier')

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """Generate a polished PDF payment voucher/receipt for outgoing payment."""
        if not REPORTLAB_AVAILABLE:
            return Response({'detail': 'PDF generation unavailable.'}, status=503)

        try:
            payment = self.get_queryset().get(pk=pk)
        except OutgoingPayment.DoesNotExist:
            return Response({'detail': 'Payment not found.'}, status=404)

        import io
        buffer = io.BytesIO()

        user = request.user
        business_name = user.business_name or user.get_full_name() or user.email or 'Kapita'
        phone = user.phone or ''
        email = user.email or ''
        website = user.website or ''
        address = user.address or ''
        currency = getattr(user, 'currency', 'ZMW') or 'ZMW'
        receipt_no = f'PAYOUT-{datetime.now().year}-{payment.id:05d}'
        transaction_id = f'TXN-OUT-{payment.id:08d}'
        issued_at = payment.transaction_date.strftime('%Y-%m-%d %H:%M')

        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
        elements = []
        styles = getSampleStyleSheet()

        # Custom styles
        base = ParagraphStyle('Base', parent=styles['Normal'], fontSize=10, leading=14)
        small = ParagraphStyle('Small', parent=base, fontSize=8, leading=11)
        title = ParagraphStyle('Title', parent=styles['Title'], fontSize=16, textColor=colors.HexColor('#111827'))
        subtitle = ParagraphStyle('Subtitle', parent=base, fontSize=12, textColor=colors.HexColor('#4b5563'))
        primary = ParagraphStyle('Primary', parent=base, textColor=colors.HexColor('#1f2937'))
        border = colors.HexColor('#e5e7eb')

        # Header
        header = Table([
            [
                Paragraph(f'<b>KAPITA</b><br/>Payment Voucher', ParagraphStyle('KapitaTitle', parent=title, fontSize=10, textColor=colors.HexColor('#059669'), leading=16)),
                Paragraph(f'{safe_text(receipt_no)}', ParagraphStyle('RightHeader', parent=title, fontSize=8, textColor=colors.HexColor('#059669'), alignment=2)),
            ]
        ], colWidths=[110*mm, 60*mm])
        header.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0fdf4')),
            ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#059669')),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(header)
        elements.append(Spacer(1, 5*mm))
        if address:
            elements.append(Paragraph(safe_text(address), small))
        contact_parts = []
        if phone: contact_parts.append(safe_text(phone))
        if email: contact_parts.append(safe_text(email))
        if website: contact_parts.append(safe_text(website))
        if contact_parts:
            elements.append(Paragraph(' | '.join(contact_parts), small))
        elements.append(Spacer(1, 3*mm))

        # Horizontal Line
        from reportlab.platypus import HRFlowable
        elements.append(HRFlowable(width='100%', thickness=0.5, color=border))
        elements.append(Spacer(1, 5*mm))

        # Transaction Details
        recipient_name = ''
        if payment.supplier:
            recipient_name = payment.supplier.name
            if payment.supplier.contact_person:
                recipient_name += f' ({payment.supplier.contact_person})'
        else:
            recipient_name = payment.get_payment_type_display()

        details = [
            ['Transaction ID', transaction_id],
            ['Date & Time', issued_at],
            ['Payment Type', payment.get_payment_type_display()],
            ['Payment Method', payment.get_payment_method_display()],
            ['Status', payment.get_status_display().title()],
            ['Reference', payment.reference or '—'],
            ['Recipient', recipient_name],
        ]
        table_data = []
        for label, value in details:
            table_data.append([
                Paragraph(f'<b>{safe_text(label)}</b>', primary),
                Paragraph(safe_text(value), primary)
            ])

        details_table = Table(table_data, colWidths=[50*mm, 120*mm])
        details_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        elements.append(details_table)
        elements.append(Spacer(1, 8*mm))

        # Amount Summary
        amount_table = Table([
            ['', Paragraph('<b>Total Amount Paid</b>', ParagraphStyle('AmountTitle', parent=title, fontSize=14, alignment=2))],
            ['', Paragraph(f'<b>{currency} {float(payment.amount):,.2f}</b>', ParagraphStyle('AmountValue', parent=title, fontSize=18, alignment=2, textColor=colors.HexColor('#059669')))],
        ], colWidths=[80*mm, 90*mm])
        amount_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdf4')),
            ('BOX', (0,0), (-1,-1), 0.7, colors.HexColor('#a7f3d0')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        elements.append(amount_table)

        if payment.notes:
            elements.append(Spacer(1, 8*mm))
            elements.append(Paragraph('<b>Notes:</b>', primary))
            elements.append(Paragraph(safe_text(payment.notes), base))
        elements.append(Spacer(1, 10*mm))

        # QR Code and Footer
        def qr_flowable():
            qr = QrCodeWidget(receipt_no)
            qr.barWidth = 2
            d = Drawing(30*mm, 30*mm)
            d.add(qr)
            return d

        signature_box = Table([
            [Paragraph('<b>Digital Signature</b><br/>Authorized Signatory', base), qr_flowable()],
            [Paragraph(f'{safe_text(business_name)}', small), Paragraph('QR for payment verification', small)],
        ], colWidths=[110 * mm, 68 * mm])
        signature_box.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.white),
            ('BOX', (0, 0), (-1, -1), 0.7, border),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 0), (1, 0), 'CENTER'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(signature_box)

        elements.append(Spacer(1, 5*mm))
        elements.append(HRFlowable(width='100%', thickness=0.5, color=border))
        elements.append(Spacer(1, 2*mm))
        elements.append(Paragraph(
            f'Generated by Kapita · {issued_at} · {safe_text(business_name)} · This is an official payment voucher.',
            ParagraphStyle('Footer', parent=small, alignment=1, textColor=colors.HexColor('#6b7280'))
        ))

        doc.build(elements)
        buffer.seek(0)
        resp = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="outgoing_payment_{payment.id}.pdf"'
        return resp
