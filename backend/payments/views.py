from io import BytesIO
from datetime import datetime

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum

from .models import Payment
from .serializers import PaymentSerializer

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.graphics.barcode.qr import QrCodeWidget
    from reportlab.graphics.shapes import Drawing
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Payment.objects.filter(user=self.request.user)
        category = self.request.query_params.get('category')
        status_filter = self.request.query_params.get('status')
        start = self.request.query_params.get('start_date')
        end = self.request.query_params.get('end_date')
        if category:
            qs = qs.filter(category=category)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if start:
            qs = qs.filter(payment_date__gte=start)
        if end:
            qs = qs.filter(payment_date__lte=end)
        return qs

    @action(detail=False, methods=['get'])
    def summary(self, request):
        qs = self.get_queryset()
        total = qs.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0
        by_category = {}
        for cat, _ in Payment.CATEGORY_CHOICES:
            by_category[cat] = float(qs.filter(category=cat, status='completed').aggregate(total=Sum('amount'))['total'] or 0)
        return Response({
            'total_paid': float(total),
            'count': qs.count(),
            'by_category': by_category,
        })

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """Generate a PDF payment voucher/receipt."""
        if not REPORTLAB_AVAILABLE:
            return Response({'detail': 'PDF generation unavailable.'}, status=503)

        try:
            payment = self.get_queryset().get(pk=pk)
        except Payment.DoesNotExist:
            return Response({'detail': 'Payment not found.'}, status=404)

        user = request.user
        business_name = user.business_name or user.get_full_name() or 'Kapita'
        currency = getattr(user, 'currency', 'ZMW') or 'ZMW'
        phone = user.phone or ''
        email_addr = user.email or ''
        address = user.address or ''

        def money(v):
            return f'{currency} {float(v):,.2f}'

        def safe(v, fallback='N/A'):
            return v if v not in (None, '', 'None') else fallback

        voucher_no = f'PV-{payment.created_at.year}-{payment.id:05d}'
        issued_at = timezone.localtime().strftime('%d %b %Y %H:%M')

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            leftMargin=14*mm, rightMargin=14*mm,
            topMargin=14*mm, bottomMargin=14*mm,
        )

        brand = colors.HexColor('#0f766e')
        soft_bg = colors.HexColor('#f8fafc')
        border = colors.HexColor('#d1d5db')
        green_bg = colors.HexColor('#d1fae5')
        red_bg = colors.HexColor('#fee2e2')

        styles = getSampleStyleSheet()
        base = ParagraphStyle('Base', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=13, textColor=colors.HexColor('#111827'))
        small = ParagraphStyle('Small', parent=base, fontSize=8, leading=10)
        heading = ParagraphStyle('Heading', parent=base, fontName='Helvetica-Bold', fontSize=17, leading=21, textColor=brand, alignment=1)
        label_b = ParagraphStyle('LabelB', parent=base, fontName='Helvetica-Bold')
        section_style = ParagraphStyle('Section', parent=base, fontName='Helvetica-Bold', fontSize=10, textColor=brand)

        elements = []

        # ── Header ───────────────────────────────────────────────────────────
        hdr = Table([
            [
                [
                    Paragraph(f'<b>{business_name}</b>', base),
                    Paragraph(safe(address), small),
                    Paragraph(f'{phone} | {email_addr}', small),
                ],
                Paragraph('PAYMENT VOUCHER', heading),
            ]
        ], colWidths=[85*mm, 97*mm])
        hdr.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('LINEBELOW', (0, -1), (-1, -1), 1, brand),
        ]))
        elements.append(hdr)
        elements.append(Spacer(1, 5*mm))

        # ── Meta row ─────────────────────────────────────────────────────────
        meta = Table([
            [
                Paragraph('<b>Voucher No.</b>', label_b), Paragraph(voucher_no, base),
                Paragraph('<b>Date</b>', label_b), Paragraph(payment.payment_date.strftime('%d %b %Y'), base),
            ],
            [
                Paragraph('<b>Status</b>', label_b), Paragraph(payment.get_status_display(), base),
                Paragraph('<b>Method</b>', label_b), Paragraph(payment.get_payment_method_display(), base),
            ],
            [
                Paragraph('<b>Reference</b>', label_b), Paragraph(safe(payment.reference_number), base),
                Paragraph('<b>Category</b>', label_b), Paragraph(payment.get_category_display(), base),
            ],
        ], colWidths=[28*mm, 60*mm, 28*mm, 66*mm])
        meta.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), soft_bg),
            ('BOX', (0, 0), (-1, -1), 0.7, border),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, border),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(meta)
        elements.append(Spacer(1, 4*mm))

        # ── Payee card ───────────────────────────────────────────────────────
        elements.append(Paragraph('Payee Details', section_style))
        elements.append(Spacer(1, 1*mm))
        payee_card = Table([
            [Paragraph(
                f'<b>Name:</b> {safe(payment.payee_name)}&nbsp;&nbsp;&nbsp;'
                f'<b>Phone:</b> {safe(payment.payee_phone)}&nbsp;&nbsp;&nbsp;'
                f'<b>Email:</b> {safe(payment.payee_email)}',
                base
            )]
        ], colWidths=[182*mm])
        payee_card.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
            ('BOX', (0, 0), (-1, -1), 0.7, border),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ]))
        elements.append(payee_card)
        elements.append(Spacer(1, 4*mm))

        # ── Description + Amount table ────────────────────────────────────────
        elements.append(Paragraph('Payment Details', section_style))
        elements.append(Spacer(1, 1*mm))
        detail_rows = [
            [
                Paragraph('<b>#</b>', small),
                Paragraph('<b>Description</b>', small),
                Paragraph('<b>Category</b>', small),
                Paragraph('<b>Amount</b>', small),
            ],
            [
                Paragraph('1', base),
                Paragraph(safe(payment.description), base),
                Paragraph(payment.get_category_display(), base),
                Paragraph(money(payment.amount), base),
            ],
        ]
        detail_t = Table(detail_rows, colWidths=[10*mm, 100*mm, 42*mm, 30*mm])
        detail_t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), brand),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BOX', (0, 0), (-1, -1), 0.7, border),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, border),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(detail_t)
        elements.append(Spacer(1, 3*mm))

        # ── Total box ────────────────────────────────────────────────────────
        total_t = Table([
            [Paragraph('<b>TOTAL AMOUNT PAID</b>', label_b), Paragraph(f'<b>{money(payment.amount)}</b>', label_b)],
        ], colWidths=[152*mm, 30*mm], hAlign='RIGHT')
        total_t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), green_bg),
            ('BOX', (0, 0), (-1, -1), 1, brand),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ]))
        elements.append(total_t)
        elements.append(Spacer(1, 4*mm))

        # ── Notes ────────────────────────────────────────────────────────────
        if payment.notes:
            elements.append(Paragraph(f'<b>Notes:</b> {payment.notes}', base))
            elements.append(Spacer(1, 4*mm))

        # ── Signatures ───────────────────────────────────────────────────────
        sig_t = Table([
            [
                Paragraph('<b>Authorized By</b>', label_b),
                Paragraph('<b>Received By</b>', label_b),
                Paragraph('<b>Approved By</b>', label_b),
            ],
            [
                Paragraph('_' * 28, small),
                Paragraph('_' * 28, small),
                Paragraph('_' * 28, small),
            ],
            [
                Paragraph(f'Name: ___________________', small),
                Paragraph(f'Name: ___________________', small),
                Paragraph(f'Name: ___________________', small),
            ],
            [
                Paragraph(f'Date: ___________________', small),
                Paragraph(f'Date: ___________________', small),
                Paragraph(f'Date: ___________________', small),
            ],
        ], colWidths=[60*mm, 60*mm, 62*mm])
        sig_t.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 0.5, border),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, border),
            ('BACKGROUND', (0, 0), (-1, 0), soft_bg),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(sig_t)
        elements.append(Spacer(1, 5*mm))

        # ── Footer ───────────────────────────────────────────────────────────
        elements.append(HRFlowable(width='100%', thickness=0.5, color=border))
        elements.append(Spacer(1, 2*mm))
        elements.append(Paragraph(
            f'Generated by Kapita · {issued_at} · {business_name} · This is an official payment voucher.',
            ParagraphStyle('Footer', parent=small, alignment=1, textColor=colors.HexColor('#6b7280'))
        ))

        doc.build(elements)
        buffer.seek(0)
        resp = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="payment_voucher_{payment.id}.pdf"'
        return resp
