from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDate
from datetime import datetime, timedelta

from .models import Sale
from .serializers import SaleSerializer, SalesSummarySerializer
import io
from django.http import HttpResponse
from django.conf import settings
import os

# Optional reportlab import for PDF generation
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    from reportlab.graphics.barcode.qr import QrCodeWidget
    from reportlab.graphics.shapes import Drawing
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class SaleViewSet(viewsets.ModelViewSet):
    """ViewSet for Sale CRUD operations"""
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['payment_type', 'product', 'customer']
    search_fields = ['product__name', 'customer__name', 'notes']
    ordering_fields = ['created_at', 'total_amount', 'profit']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Sale.objects.filter(user=self.request.user).select_related(
            'product', 'customer'
        )
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get sales summary statistics"""
        sales = self.get_queryset()
        
        total_sales = sales.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        total_profit = sum(sale.profit for sale in sales)
        
        cash_sales = sales.filter(payment_type='cash').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        mobile_money_sales = sales.filter(payment_type='mobile_money').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        credit_sales = sales.filter(payment_type='credit').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        data = {
            'total_sales': total_sales,
            'total_profit': total_profit,
            'total_transactions': sales.count(),
            'cash_sales': cash_sales,
            'mobile_money_sales': mobile_money_sales,
            'credit_sales': credit_sales,
        }
        
        serializer = SalesSummarySerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def daily_sales(self, request):
        """Get daily sales for the last 30 days"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        sales = Sale.objects.filter(
            user=request.user,
            created_at__gte=start_date,
            created_at__lte=end_date
        ).annotate(day=TruncDate('created_at')).values('day').annotate(
            total=Sum('total_amount'),
            count=Count('id')
        ).order_by('day')
        
        return Response(list(sales))

    @action(detail=False, methods=['get'])
    def top_products(self, request):
        """Get top selling products"""
        limit = int(request.query_params.get('limit', 10))
        
        sales = self.get_queryset().values(
            'product__id',
            'product__name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('total_amount')
        ).order_by('-total_revenue')[:limit]
        
        return Response([
            {
                'product_id': item['product__id'],
                'product_name': item['product__name'],
                'total_quantity': item['total_quantity'],
                'total_revenue': float(item['total_revenue'] or 0),
            }
            for item in sales
        ])

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent sales"""
        limit = int(request.query_params.get('limit', 10))
        sales = self.get_queryset()[:limit]
        serializer = self.get_serializer(sales, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """Generate a polished PDF receipt for a sale and return it as an attachment."""
        
        # Check if reportlab is available
        if not REPORTLAB_AVAILABLE:
            return Response({
                'detail': 'PDF generation is not available on this deployment. Reportlab library is not installed.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        try:
            sale = self.get_queryset().get(pk=pk)
        except Sale.DoesNotExist:
            return Response({'detail': 'Sale not found.'}, status=404)

        user = request.user
        business_name = user.business_name or user.get_full_name() or user.email or 'Kapita'
        phone = user.phone or ''
        email = user.email or ''
        website = user.website or ''
        address = user.address or ''
        tin = user.tin or ''
        vat = user.vat_number or ''
        business_reg = user.business_registration_number or ''
        seller_name = user.get_full_name() or user.username or ''
        receipt_tagline = user.receipt_tagline or 'Official proof of purchase'
        receipt_thank_you = user.receipt_thank_you or 'Thank you for your purchase! We appreciate your business.'
        receipt_return_policy = user.receipt_return_policy or 'Return/Exchange Policy: Items may be returned within 7 days with proof of purchase, subject to inspection.'
        receipt_no = f'REC-{datetime.now().year}-{sale.id:05d}'
        transaction_id = f'TXN-{sale.id:08d}'
        transaction_dt = sale.created_at.strftime('%Y-%m-%d %H:%M')

        currency = getattr(user, 'currency', 'ZMW') or 'ZMW'
        amount_paid = sale.deposit_amount if sale.payment_type == 'credit' else sale.total_amount
        balance_due = sale.remaining_balance if sale.payment_type == 'credit' else 0
        subtotal = sale.quantity * sale.unit_price
        
        # Calculate discount from sale
        discount_amount = float(sale.discount_amount) if sale.discount_amount else 0
        promotion_name = sale.promotion_name or ''
        discount_type = sale.discount_type or 'none'
        
        tax_amount = 0  # No tax calculation for now
        shipping_amount = 0  # No shipping for now
        grand_total = sale.total_amount

        def money(value):
            return f'{currency} {float(value):,.2f}'

        def safe_text(value, fallback='Not provided'):
            return value if value not in (None, '') else fallback

        logo_paths = [
            os.path.join(settings.BASE_DIR, 'static', 'kapita_logo.png'),
            os.path.join(settings.BASE_DIR, 'media', 'kapita_logo.png'),
            os.path.join(settings.BASE_DIR, 'staticfiles', 'kapita_logo.png'),
        ]
        logo_path = None
        for lp in logo_paths:
            if os.path.exists(lp):
                logo_path = lp
                break

        buffer = io.BytesIO()
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

        def qr_flowable():
            qr_text = request.build_absolute_uri(request.path)
            qr = QrCodeWidget(qr_text)
            bounds = qr.getBounds()
            width = bounds[2] - bounds[0]
            height = bounds[3] - bounds[1]
            size = 32 * mm
            drawing = Drawing(size, size, transform=[size / width, 0, 0, size / height, 0, 0])
            drawing.add(qr)
            return drawing

        elements = []

        header_right = [
            Paragraph(f'<b>{safe_text(business_name)}</b>', base),
            Paragraph(f'{safe_text(address)}', small),
            Paragraph(f'Phone: {safe_text(phone)}', small),
            Paragraph(f'Email: {safe_text(email)}', small),
            Paragraph(f'Website: {safe_text(website)}', small),
            Paragraph(f'TIN / VAT / Business Reg: {safe_text(tin)} / {safe_text(vat)} / {safe_text(business_reg)}', small),
        ]
        header = Table([[build_logo_block(), header_right]], colWidths=[46 * mm, 132 * mm])
        header.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        elements.append(header)
        elements.append(Spacer(1, 4 * mm))

        elements.append(Paragraph('SALES RECEIPT', title_style))
        elements.append(Paragraph(receipt_tagline, ParagraphStyle('Subtitle', parent=small, alignment=1, textColor=colors.HexColor('#6b7280'))))
        elements.append(Spacer(1, 3 * mm))

        meta_rows = [
            [Paragraph('Receipt No.', label_style), Paragraph(receipt_no, base), Paragraph('Date & Time', label_style), Paragraph(transaction_dt, base)],
            [Paragraph('Transaction ID', label_style), Paragraph(transaction_id, base), Paragraph('Salesperson', label_style), Paragraph(seller_name, base)],
        ]
        meta = Table(meta_rows, colWidths=[30 * mm, 62 * mm, 30 * mm, 62 * mm])
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

        customer_name = sale.customer.name if sale.customer else 'Walk-in Customer'
        customer_phone = sale.customer.phone if sale.customer else 'Not provided'
        customer_email = sale.customer.email if sale.customer and sale.customer.email else 'Not provided'
        customer_address = sale.customer.address if sale.customer and sale.customer.address else 'Not provided'
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

        item_rows = [
            [
                Paragraph('<b>#</b>', small),
                Paragraph('<b>Description</b>', small),
                Paragraph('<b>Qty</b>', small),
                Paragraph('<b>Unit Price</b>', small),
                Paragraph('<b>Subtotal</b>', small),
                Paragraph('<b>Tax</b>', small),
                Paragraph('<b>Discount</b>', small),
                Paragraph('<b>Total</b>', small),
            ],
            [
                Paragraph('1', base),
                Paragraph(sale.product.name if sale.product else 'Not provided', base),
                Paragraph(str(sale.quantity), base),
                Paragraph(money(sale.unit_price), base),
                Paragraph(money(subtotal), base),
                Paragraph(money(tax_amount), base),
                Paragraph(money(discount_amount), base),
                Paragraph(money(grand_total), base),
            ],
        ]
        items = Table(item_rows, colWidths=[10 * mm, 58 * mm, 15 * mm, 24 * mm, 25 * mm, 18 * mm, 22 * mm, 26 * mm])
        items.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), brand),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('BOX', (0, 0), (-1, -1), 0.7, border),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, border),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(Paragraph('Itemized Details', section_style))
        elements.append(items)
        elements.append(Spacer(1, 4 * mm))

        # Add promotion/discount section if applicable
        if discount_amount > 0 and discount_type != 'none':
            promo_header = Paragraph('💰 Discount Applied', section_style)
            elements.append(promo_header)
            
            discount_info_lines = []
            if promotion_name:
                discount_info_lines.append(f'<b>Promotion:</b> {promotion_name}')
            
            if discount_type == 'percentage':
                discount_pct = (float(sale.discount_value) if sale.discount_value else 0)
                discount_info_lines.append(f'<b>Type:</b> {discount_pct}% Off')
            elif discount_type == 'fixed':
                discount_info_lines.append(f'<b>Type:</b> Fixed Amount Discount')
            
            discount_info_lines.append(f'<b>You Saved:</b> {money(discount_amount)}')
            
            promo_content = Paragraph('<br/>'.join(discount_info_lines), base)
            
            promo_card = Table([[promo_content]], colWidths=[178 * mm])
            promo_card.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#d1fae5')),  # Light green
                ('BOX', (0, 0), (-1, -1), 0.7, colors.HexColor('#10b981')),  # Green border
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]))
            elements.append(promo_card)
            elements.append(Spacer(1, 4 * mm))

        summary_rows = [
            ['Subtotal', money(subtotal)],
            ['Tax Amount', money(tax_amount)],
            ['Discount', money(discount_amount)],
            ['Shipping / Delivery', money(shipping_amount)],
            ['Grand Total', money(grand_total)],
            ['Amount Paid', money(amount_paid)],
            ['Balance Due', money(balance_due)],
            ['Payment Method', sale.payment_type.replace('_', ' ').title()],
        ]
        summary = Table(summary_rows, colWidths=[42 * mm, 40 * mm], hAlign='RIGHT')
        summary.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), soft_bg),
            ('BOX', (0, 0), (-1, -1), 0.7, border),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, border),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (0, 4), (-1, 4), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#d1fae5')),
            ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#fee2e2')),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(Paragraph('Summary', section_style))
        elements.append(summary)
        elements.append(Spacer(1, 5 * mm))

        signature_box = Table([
            [Paragraph('<b>Digital Signature</b><br/>Authorized Seller', base), qr_flowable()],
            [Paragraph(f'{safe_text(business_name)}<br/>{safe_text(seller_name)}', small), Paragraph('QR code for receipt verification', small)],
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
        elements.append(Spacer(1, 4 * mm))

        for line in [
            receipt_thank_you,
            receipt_return_policy,
            f'Contact: {safe_text(phone)} | {safe_text(email)} | {safe_text(website)}',
        ]:
            elements.append(Paragraph(line, small))

        doc.build(elements)

        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="receipt_{sale.id}.pdf"'
        return response
