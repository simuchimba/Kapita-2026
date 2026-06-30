import io
import os
from django.conf import settings
from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Invoice
from .serializers import InvoiceSerializer, InvoiceListSerializer

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm, cm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
        Image as RLImage, HRFlowable
    )
    from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer

    def get_queryset(self):
        return Invoice.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        invoice = self.get_object()
        if not REPORTLAB_AVAILABLE:
            return Response({'error': 'PDF generation not available'}, status=503)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20*mm, bottomMargin=15*mm)
        styles = getSampleStyleSheet()
        elements = []

        user = request.user
        logo_path = None
        if user.logo and os.path.exists(user.logo.path):
            logo_path = user.logo.path

        title_style = ParagraphStyle('Title', fontSize=22, textColor=colors.HexColor('#059669'),
                                      spaceAfter=4, spaceBefore=0)
        info_style = ParagraphStyle('Info', fontSize=9, textColor=colors.gray, spaceAfter=2)
        header_style = ParagraphStyle('Header', fontSize=10, textColor=colors.white, spaceAfter=0)
        normal = styles['Normal']

        data = [[
            Paragraph(f"<b>INVOICE</b><br/>{invoice.invoice_number}", title_style),
            Paragraph(
                f"<b>{user.business_name or user.get_full_name() or user.username}</b><br/>"
                f"{user.address or ''}<br/>"
                f"{user.email or ''}<br/>{user.phone or ''}",
                ParagraphStyle('BizInfo', fontSize=9, alignment=TA_RIGHT, spaceAfter=0)
            )
        ]]
        elements.append(Table(data, colWidths=[doc.width*0.5, doc.width*0.5]))
        elements.append(Spacer(1, 10*mm))

        bill_data = [
            [Paragraph('<b>Bill To:</b>', normal),
             Paragraph('<b>Invoice Details:</b>', ParagraphStyle('Det', fontSize=9, alignment=TA_RIGHT))],
            [Paragraph(invoice.customer_name, normal),
             Paragraph(f"Issue Date: {invoice.issue_date}", ParagraphStyle('Det2', fontSize=9, alignment=TA_RIGHT))],
            [Paragraph(invoice.customer_address or '', normal),
             Paragraph(f"Due Date: {invoice.due_date}", ParagraphStyle('Det3', fontSize=9, alignment=TA_RIGHT))],
        ]
        if invoice.customer_email:
            bill_data.append(['', Paragraph(f"Email: {invoice.customer_email}", ParagraphStyle('Det4', fontSize=9, alignment=TA_RIGHT))])
        elements.append(Table(bill_data, colWidths=[doc.width*0.5, doc.width*0.5]))
        elements.append(Spacer(1, 8*mm))

        table_data = [
            [Paragraph('<b>#</b>', header_style),
             Paragraph('<b>Description</b>', header_style),
             Paragraph('<b>Qty</b>', ParagraphStyle('Hdr', fontSize=10, textColor=colors.white, alignment=TA_CENTER)),
             Paragraph('<b>Unit Price</b>', ParagraphStyle('Hdr2', fontSize=10, textColor=colors.white, alignment=TA_RIGHT)),
             Paragraph('<b>Total</b>', ParagraphStyle('Hdr3', fontSize=10, textColor=colors.white, alignment=TA_RIGHT))]
        ]

        for idx, item in enumerate(invoice.items.all(), 1):
            table_data.append([
                str(idx),
                Paragraph(item.description, normal),
                str(item.quantity),
                f"{item.unit_price:.2f}",
                f"{item.total:.2f}"
            ])

        table_data.append(['', '', '', 'Subtotal:', f"{invoice.subtotal:.2f}"])
        if invoice.tax_rate > 0:
            table_data.append(['', '', '', f"{invoice.tax_name or 'Tax'} ({invoice.tax_rate}%):", f"{invoice.tax_amount:.2f}"])
        if invoice.discount_amount > 0:
            table_data.append(['', '', '', f"{invoice.discount_name or 'Discount'}:", f"-{invoice.discount_amount:.2f}"])
        table_data.append(['', '', '', 'Total:', f"{invoice.total_amount:.2f}"])

        col_widths = [12*mm, doc.width*0.4, 22*mm, 30*mm, 30*mm]
        t = Table(table_data, colWidths=col_widths, repeatRows=1)
        style_cmds = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
            ('ALIGN', (2, 0), (2, -1), 'CENTER'),
            ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, -4), (-1, -1), 'Helvetica-Bold'),
            ('LINEABOVE', (0, -4), (-1, -4), 1, colors.HexColor('#059669')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f0fdf4')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]
        t.setStyle(TableStyle(style_cmds))
        elements.append(t)
        elements.append(Spacer(1, 10*mm))

        if invoice.notes:
            elements.append(Paragraph(f'<b>Notes:</b><br/>{invoice.notes}', normal))
            elements.append(Spacer(1, 5*mm))
        if invoice.terms_conditions:
            elements.append(Paragraph(f'<b>Terms & Conditions:</b><br/>{invoice.terms_conditions}', normal))
            elements.append(Spacer(1, 5*mm))

        elements.append(HRFlowable(width='100%', color=colors.HexColor('#d1d5db')))
        elements.append(Spacer(1, 3*mm))
        elements.append(Paragraph(
            f"Generated by Kapita on {timezone.now().strftime('%Y-%m-%d %H:%M')}",
            ParagraphStyle('Footer', fontSize=8, textColor=colors.gray, alignment=TA_CENTER)
        ))

        doc.build(elements)
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True,
                            filename=f"Invoice_{invoice.invoice_number}.pdf",
                            content_type='application/pdf')

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        amount = request.data.get('amount', invoice.balance_due)
        invoice.amount_paid += float(amount)
        if invoice.amount_paid >= invoice.total_amount:
            invoice.status = 'paid'
        else:
            invoice.status = 'sent'
        invoice.save()
        return Response(InvoiceSerializer(invoice).data)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = 'sent'
        invoice.save()
        return Response(InvoiceSerializer(invoice).data)
