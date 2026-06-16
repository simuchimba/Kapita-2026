from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum
from django.conf import settings
from django.http import HttpResponse
import os
from io import BytesIO

from .models import Quotation, QuotationItem
from .serializers import QuotationSerializer

# Reportlab imports for PDF generation
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class QuotationViewSet(viewsets.ModelViewSet):
    """ViewSet for Quotation CRUD operations"""
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['customer', 'status']
    search_fields = ['subject', 'customer__name', 'notes']
    ordering_fields = ['created_at', 'total_amount', 'quotation_number']
    ordering = ['-created_at']

    def get_queryset(self):
        return Quotation.objects.filter(user=self.request.user).select_related(
            'customer'
        ).prefetch_related('items')

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """Generate a polished PDF quotation"""
        if not REPORTLAB_AVAILABLE:
            return Response({
                'detail': 'PDF generation is not available. Reportlab library is not installed.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            quotation = self.get_queryset().get(pk=pk)
        except Quotation.DoesNotExist:
            return Response({'detail': 'Quotation not found.'}, status=404)

        user = request.user
        business_name = user.business_name or user.get_full_name() or user.email or 'Kapita'
        phone = user.phone or ''
        email = user.email or ''
        website = user.website or ''
        address = user.address or ''
        tin = user.tin or ''
        vat_number = user.vat_number or ''
        business_reg = user.business_registration_number or ''

        # Bank details
        bank_name = user.bank_name or ''
        bank_account_name = user.bank_account_name or ''
        bank_account_number = user.bank_account_number or ''
        bank_sort_code = user.bank_sort_code or ''
        bank_iban = user.bank_iban or ''
        bank_swift = user.bank_swift or ''

        currency = getattr(user, 'currency', 'ZMW') or 'ZMW'

        def money(value):
            return f'{currency} {float(value):,.2f}'

        def safe_text(value, fallback=''):
            return value if value not in (None, '') else fallback

        # Logo handling - safely check if path exists
        logo_path = None
        if user.logo:
            try:
                # Try to use local path if available
                if hasattr(user.logo, 'path') and os.path.exists(user.logo.path):
                    logo_path = user.logo.path
            except (NotImplementedError, ValueError):
                # Skip if path isn't available (e.g., remote storage like S3)
                pass
        
        if not logo_path:
            # Fallback to default logo paths
            logo_paths = [
                os.path.join(settings.BASE_DIR, 'static', 'kapita_logo.png'),
                os.path.join(settings.BASE_DIR, 'media', 'kapita_logo.png'),
                os.path.join(settings.BASE_DIR, 'staticfiles', 'kapita_logo.png'),
            ]
            for lp in logo_paths:
                if os.path.exists(lp):
                    logo_path = lp
                    break

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=12 * mm,
            rightMargin=12 * mm,
            topMargin=12 * mm,
            bottomMargin=12 * mm,
        )

        styles = getSampleStyleSheet()
        base = ParagraphStyle(
            'Base',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#111827'),
        )
        small = ParagraphStyle('Small', parent=base, fontSize=8, leading=10)
        title_style = ParagraphStyle(
            'Title',
            parent=base,
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            alignment=1,
            textColor=colors.HexColor('#0f766e'),
            spaceAfter=4,
        )
        section_style = ParagraphStyle(
            'Section',
            parent=base,
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=12,
            textColor=colors.HexColor('#0f766e'),
            spaceAfter=4,
        )
        label_style = ParagraphStyle(
            'Label',
            parent=base,
            fontName='Helvetica-Bold',
            fontSize=8,
            textColor=colors.HexColor('#374151'),
        )

        brand = colors.HexColor('#0f766e')
        soft_bg = colors.HexColor('#f8fafc')
        border = colors.HexColor('#d1d5db')

        def build_logo_block():
            if logo_path:
                try:
                    return Image(logo_path, width=42 * mm, height=18 * mm)
                except Exception:
                    pass
            # Fallback logo
            logo_table = Table(
                [[Paragraph('<b>KAPITA</b>', ParagraphStyle('LogoName', parent=base, fontName='Helvetica-Bold', fontSize=15, textColor=colors.white, alignment=1))]],
                colWidths=[42 * mm],
                rowHeights=[18 * mm],
            )
            logo_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), brand),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('BOX', (0, 0), (-1, -1), 0.5, brand),
            ]))
            return logo_table

        elements = []

        # Header: logo + company details
        header_right = [
            Paragraph(f'<b>{safe_text(business_name)}</b>', base),
            Paragraph(f'{safe_text(address)}', small),
            Paragraph(f'Phone: {safe_text(phone)}', small),
            Paragraph(f'Email: {safe_text(email)}', small),
            Paragraph(f'Website: {safe_text(website)}', small),
        ]
        if tin or vat_number or business_reg:
            header_right.append(Paragraph(f'TIN: {safe_text(tin)} | VAT: {safe_text(vat_number)} | Reg: {safe_text(business_reg)}', small))
        header = Table([[build_logo_block(), header_right]], colWidths=[46 * mm, 132 * mm])
        header.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        elements.append(header)
        elements.append(Spacer(1, 4 * mm))

        # Title
        elements.append(Paragraph('QUOTATION', title_style))
        elements.append(Spacer(1, 3 * mm))

        # Quotation meta data
        meta_rows = [
            [
                Paragraph('Quotation No.', label_style),
                Paragraph(quotation.quotation_number, base),
                Paragraph('Date', label_style),
                Paragraph(quotation.created_at.strftime('%d %b %Y'), base),
            ],
        ]
        meta = Table(meta_rows, colWidths=[35 * mm, 60 * mm, 35 * mm, 60 * mm])
        meta.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), soft_bg),
            ('BOX', (0, 0), (-1, -1), 0.7, border),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, border),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(meta)
        elements.append(Spacer(1, 4 * mm))

        # Subject
        elements.append(Paragraph(f'Subject: {safe_text(quotation.subject)}', section_style))
        elements.append(Spacer(1, 3 * mm))

        # Customer details
        if quotation.customer:
            customer_name = quotation.customer.name or 'Not provided'
            customer_phone = quotation.customer.phone or 'Not provided'
            customer_email = quotation.customer.email or 'Not provided'
            customer_address = quotation.customer.address or 'Not provided'
        else:
            customer_name = customer_phone = customer_email = customer_address = 'Not provided'

        customer_card = Table([
            [Paragraph('Customer Information', section_style)],
            [Paragraph(f'<b>Name:</b> {safe_text(customer_name)}<br/><b>Phone:</b> {safe_text(customer_phone)}<br/><b>Email:</b> {safe_text(customer_email)}<br/><b>Address:</b> {safe_text(customer_address)}', base)],
        ], colWidths=[178 * mm])
        customer_card.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
            ('BOX', (0, 0), (-1, -1), 0.7, border),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(customer_card)
        elements.append(Spacer(1, 4 * mm))

        # Introduction
        if quotation.introduction:
            elements.append(Paragraph('Introduction', section_style))
            elements.append(Paragraph(safe_text(quotation.introduction), base))
            elements.append(Spacer(1, 3 * mm))

        # Itemized table
        elements.append(Paragraph('Itemized Pricing', section_style))
        item_rows = [
            [
                Paragraph('<b>#</b>', small),
                Paragraph('<b>Description</b>', small),
                Paragraph('<b>Qty</b>', small),
                Paragraph('<b>Unit Price</b>', small),
                Paragraph('<b>Total</b>', small),
            ],
        ]
        for idx, item in enumerate(quotation.items.all(), 1):
            item_rows.append([
                Paragraph(str(idx), base),
                Paragraph(safe_text(item.description), base),
                Paragraph(f"{float(item.quantity):g}", base),
                Paragraph(money(item.unit_price), base),
                Paragraph(money(item.total), base),
            ])
        items = Table(item_rows, colWidths=[10 * mm, 90 * mm, 20 * mm, 30 * mm, 30 * mm])
        items.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), brand),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BOX', (0, 0), (-1, -1), 0.7, border),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, border),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(items)
        elements.append(Spacer(1, 4 * mm))

        # Summary table
        summary_rows = [
            ['Subtotal', money(quotation.subtotal)],
            [f'VAT ({float(quotation.vat_percentage)}%)', money(quotation.vat_amount)],
            ['Grand Total', money(quotation.total_amount)],
        ]
        summary = Table(summary_rows, colWidths=[45 * mm, 40 * mm], hAlign='RIGHT')
        summary.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), soft_bg),
            ('BOX', (0, 0), (-1, -1), 0.7, border),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, border),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#d1fae5')),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(summary)
        elements.append(Spacer(1, 5 * mm))

        # Terms sections
        terms_sections = [
            ('Delivery Period', quotation.delivery_period),
            ('Payment Terms', quotation.payment_terms),
            ('Warranty', quotation.warranty),
            ('Validity Period', quotation.validity_period),
            ('Terms and Conditions', quotation.terms_and_conditions),
        ]
        for title, content in terms_sections:
            if content:
                elements.append(Paragraph(title, section_style))
                elements.append(Paragraph(safe_text(content), base))
                elements.append(Spacer(1, 3 * mm))

        # Bank details
        if any([bank_name, bank_account_name, bank_account_number, bank_sort_code, bank_iban, bank_swift]):
            elements.append(Paragraph('Bank Details', section_style))
            bank_lines = []
            if bank_name:
                bank_lines.append(f'<b>Bank Name:</b> {bank_name}')
            if bank_account_name:
                bank_lines.append(f'<b>Account Name:</b> {bank_account_name}')
            if bank_account_number:
                bank_lines.append(f'<b>Account Number:</b> {bank_account_number}')
            if bank_sort_code:
                bank_lines.append(f'<b>Sort Code:</b> {bank_sort_code}')
            if bank_iban:
                bank_lines.append(f'<b>IBAN:</b> {bank_iban}')
            if bank_swift:
                bank_lines.append(f'<b>SWIFT:</b> {bank_swift}')
            bank_card = Table([[Paragraph('<br/>'.join(bank_lines), base)]], colWidths=[178 * mm])
            bank_card.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
                ('BOX', (0, 0), (-1, -1), 0.7, border),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(bank_card)
            elements.append(Spacer(1, 5 * mm))

        # Signatures
        signature_rows = [
            [
                Paragraph('<b>Authorized Signature</b>', base),
                Paragraph('<b>Client Acceptance</b>', base),
            ],
            [
                Paragraph('_' * 40, small),
                Paragraph('_' * 40, small),
            ],
            [
                Paragraph('Name: _________________________', small),
                Paragraph('Name: _________________________', small),
            ],
            [
                Paragraph('Date: _________________________', small),
                Paragraph('Date: _________________________', small),
            ],
        ]
        signatures = Table(signature_rows, colWidths=[88 * mm, 88 * mm])
        signatures.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 0.5, border),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, border),
            ('BACKGROUND', (0, 0), (-1, 0), soft_bg),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(signatures)

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="quotation_{quotation.id}.pdf"'
        return response
