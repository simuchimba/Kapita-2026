"""
Cash Flow Statement API
Returns structured operating/investing/financing cashflow with PDF generation.
"""
from datetime import datetime, timedelta
from io import BytesIO

from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum

from sales.models import Sale
from expenses.models import Expense
from credits.models import Credit
from reinvestments.models import Reinvestment
from outgoing_payments.models import OutgoingPayment

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


def _parse_dates(request):
    """Parse start/end date from query params, default to current month."""
    now = timezone.localtime()
    start_str = request.query_params.get('start_date')
    end_str = request.query_params.get('end_date')
    period = request.query_params.get('period', 'month')

    if start_str and end_str:
        try:
            start = timezone.make_aware(datetime.strptime(start_str, '%Y-%m-%d'))
            end = timezone.make_aware(datetime.strptime(end_str, '%Y-%m-%d') + timedelta(days=1))
        except ValueError:
            start = timezone.make_aware(datetime(now.year, now.month, 1))
            end = now
    elif period == 'week':
        start = now - timedelta(days=7)
        end = now
    elif period == 'quarter':
        month = ((now.month - 1) // 3) * 3 + 1
        start = timezone.make_aware(datetime(now.year, month, 1))
        end = now
    elif period == 'year':
        start = timezone.make_aware(datetime(now.year, 1, 1))
        end = now
    else:  # month (default)
        start = timezone.make_aware(datetime(now.year, now.month, 1))
        end = now

    return start, end


class CashFlowStatementView(APIView):
    """Full cash flow statement: operating + investing + financing activities."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        start, end = _parse_dates(request)
        start_day = start.date()
        end_day = end.date()

        # ── OPERATING ACTIVITIES ─────────────────────────────────────────────

        # Cash inflows
        cash_sales = Sale.objects.filter(
            user=user, created_at__gte=start, created_at__lt=end,
            payment_type='cash'
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        mobile_money_sales = Sale.objects.filter(
            user=user, created_at__gte=start, created_at__lt=end,
            payment_type='mobile_money'
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # Credit payments received in this period
        credit_payments_received = Credit.objects.filter(
            user=user,
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
        # More precise: look at deposit amounts collected on credit sales in period
        credit_deposits = Sale.objects.filter(
            user=user, created_at__gte=start, created_at__lt=end,
            payment_type='credit'
        ).aggregate(total=Sum('deposit_amount'))['total'] or 0

        total_inflows = float(cash_sales) + float(mobile_money_sales) + float(credit_deposits)

        # Cash outflows — operating
        operating_expenses = Expense.objects.filter(
            user=user, date__gte=start_day, date__lt=end_day
        ).exclude(category='stock_purchase').aggregate(total=Sum('amount'))['total'] or 0

        stock_purchases = Expense.objects.filter(
            user=user, date__gte=start_day, date__lt=end_day,
            category='stock_purchase'
        ).aggregate(total=Sum('amount'))['total'] or 0

        salaries = Expense.objects.filter(
            user=user, date__gte=start_day, date__lt=end_day,
            category='salaries'
        ).aggregate(total=Sum('amount'))['total'] or 0

        rent = Expense.objects.filter(
            user=user, date__gte=start_day, date__lt=end_day,
            category='rent'
        ).aggregate(total=Sum('amount'))['total'] or 0

        utilities = Expense.objects.filter(
            user=user, date__gte=start_day, date__lt=end_day,
            category='utilities'
        ).aggregate(total=Sum('amount'))['total'] or 0

        transport = Expense.objects.filter(
            user=user, date__gte=start_day, date__lt=end_day,
            category='transport'
        ).aggregate(total=Sum('amount'))['total'] or 0

        marketing = Expense.objects.filter(
            user=user, date__gte=start_day, date__lt=end_day,
            category='marketing'
        ).aggregate(total=Sum('amount'))['total'] or 0

        other_expenses = Expense.objects.filter(
            user=user, date__gte=start_day, date__lt=end_day,
            category='other'
        ).aggregate(total=Sum('amount'))['total'] or 0

        personal_withdrawals = Expense.objects.filter(
            user=user, date__gte=start_day, date__lt=end_day,
            category='personal_withdrawal'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Outgoing payments (new feature)
        outgoing_payments = OutgoingPayment.objects.filter(
            user=user, transaction_date__gte=start, transaction_date__lt=end,
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or 0

        total_outflows = (
            float(operating_expenses) +
            float(stock_purchases) +
            float(outgoing_payments)
        )

        net_operating = total_inflows - total_outflows

        # ── INVESTING ACTIVITIES ──────────────────────────────────────────────
        reinvestments = Reinvestment.objects.filter(
            user=user, date__gte=start_day, date__lt=end_day
        ).aggregate(total=Sum('amount'))['total'] or 0

        net_investing = -float(reinvestments)  # outflow

        # ── FINANCING ACTIVITIES ──────────────────────────────────────────────
        net_financing = -float(personal_withdrawals)

        # ── NET CHANGE ───────────────────────────────────────────────────────
        net_change = net_operating + net_investing + net_financing

        # ── CREDIT SALES (non-cash) ──────────────────────────────────────────
        credit_sales_total = Sale.objects.filter(
            user=user, created_at__gte=start, created_at__lt=end,
            payment_type='credit'
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        outstanding_receivables = Credit.objects.filter(
            user=user,
            status__in=['pending', 'partial', 'overdue']
        ).aggregate(total=Sum('remaining_balance'))['total'] or 0

        # Expense line items for detail
        expense_details = list(
            Expense.objects.filter(
                user=user, date__gte=start_day, date__lt=end_day
            ).order_by('-amount').values('title', 'category', 'amount', 'date')[:20]
        )
        for e in expense_details:
            e['amount'] = float(e['amount'])
            e['date'] = e['date'].isoformat()

        return Response({
            'period': {
                'start': start.date().isoformat(),
                'end': (end - timedelta(days=1)).date().isoformat(),
                'label': f"{start.strftime('%d %b %Y')} – {(end - timedelta(days=1)).strftime('%d %b %Y')}",
            },
            'operating_activities': {
                'inflows': {
                    'cash_sales': float(cash_sales),
                    'mobile_money_sales': float(mobile_money_sales),
                    'credit_deposits_collected': float(credit_deposits),
                    'total': total_inflows,
                },
                'outflows': {
                    'stock_purchases': float(stock_purchases),
                    'salaries': float(salaries),
                    'rent': float(rent),
                    'utilities': float(utilities),
                    'transport': float(transport),
                    'marketing': float(marketing),
                    'other_expenses': float(other_expenses),
                    'outgoing_payments': float(outgoing_payments),
                    'total': total_outflows,
                },
                'net': net_operating,
            },
            'investing_activities': {
                'reinvestments': float(reinvestments),
                'net': net_investing,
            },
            'financing_activities': {
                'personal_withdrawals': float(personal_withdrawals),
                'net': net_financing,
            },
            'summary': {
                'net_cash_change': net_change,
                'is_positive': net_change >= 0,
            },
            'non_cash_memo': {
                'credit_sales': float(credit_sales_total),
                'outstanding_receivables': float(outstanding_receivables),
            },
            'expense_details': expense_details,
        })


class CashFlowPDFView(APIView):
    """Generate a polished PDF cash flow statement."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not REPORTLAB_AVAILABLE:
            return Response(
                {'detail': 'PDF generation unavailable. Reportlab not installed.'},
                status=503
            )

        user = request.user
        start, end = _parse_dates(request)
        start_day = start.date()
        end_day = end.date()
        period_label = f"{start.strftime('%d %b %Y')} – {(end - timedelta(days=1)).strftime('%d %b %Y')}"

        # ── Collect data (same logic as GET) ─────────────────────────────────
        cash_sales = float(Sale.objects.filter(user=user, created_at__gte=start, created_at__lt=end, payment_type='cash').aggregate(total=Sum('total_amount'))['total'] or 0)
        mobile_sales = float(Sale.objects.filter(user=user, created_at__gte=start, created_at__lt=end, payment_type='mobile_money').aggregate(total=Sum('total_amount'))['total'] or 0)
        credit_deposits = float(Sale.objects.filter(user=user, created_at__gte=start, created_at__lt=end, payment_type='credit').aggregate(total=Sum('deposit_amount'))['total'] or 0)
        total_inflows = cash_sales + mobile_sales + credit_deposits

        def cat_sum(cat):
            return float(Expense.objects.filter(user=user, date__gte=start_day, date__lt=end_day, category=cat).aggregate(total=Sum('amount'))['total'] or 0)

        stock = cat_sum('stock_purchase')
        salaries = cat_sum('salaries')
        rent = cat_sum('rent')
        utilities = cat_sum('utilities')
        transport = cat_sum('transport')
        marketing = cat_sum('marketing')
        other = cat_sum('other')
        airtime = cat_sum('airtime')
        withdrawals = cat_sum('personal_withdrawal')
        outgoing = float(OutgoingPayment.objects.filter(user=user, transaction_date__gte=start, transaction_date__lt=end, status='completed').aggregate(total=Sum('amount'))['total'] or 0)
        total_outflows = stock + salaries + rent + utilities + transport + marketing + other + airtime + outgoing
        net_operating = total_inflows - total_outflows

        reinvestments = float(Reinvestment.objects.filter(user=user, date__gte=start_day, date__lt=end_day).aggregate(total=Sum('amount'))['total'] or 0)
        net_investing = -reinvestments
        net_financing = -withdrawals
        net_change = net_operating + net_investing + net_financing

        credit_sales = float(Sale.objects.filter(user=user, created_at__gte=start, created_at__lt=end, payment_type='credit').aggregate(total=Sum('total_amount'))['total'] or 0)
        outstanding = float(Credit.objects.filter(user=user, status__in=['pending', 'partial', 'overdue']).aggregate(total=Sum('remaining_balance'))['total'] or 0)

        business_name = user.business_name or user.get_full_name() or 'Kapita'
        currency = getattr(user, 'currency', 'ZMW') or 'ZMW'
        phone = user.phone or ''
        email = user.email or ''

        def money(v):
            return f'{currency} {float(v):,.2f}'

        # ── Build PDF ─────────────────────────────────────────────────────────
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
        section_bg = colors.HexColor('#f0fdf4')

        styles = getSampleStyleSheet()
        base = ParagraphStyle('Base', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=13, textColor=colors.HexColor('#111827'))
        small = ParagraphStyle('Small', parent=base, fontSize=8, leading=10)
        heading = ParagraphStyle('Heading', parent=base, fontName='Helvetica-Bold', fontSize=16, leading=20, textColor=brand, alignment=1)
        sub_heading = ParagraphStyle('SubHeading', parent=base, fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=brand)
        label_b = ParagraphStyle('LabelB', parent=base, fontName='Helvetica-Bold', fontSize=9)

        def section_table(title, rows, net_value, net_label='Net'):
            """Build a section table with header, rows, and net row."""
            table_data = [
                [Paragraph(f'<b>{title}</b>', sub_heading), ''],
            ]
            for label, value in rows:
                color = colors.HexColor('#dc2626') if value < 0 else colors.HexColor('#111827')
                table_data.append([
                    Paragraph(label, base),
                    Paragraph(f'<font color="{"#dc2626" if value < 0 else "#111827"}">{money(abs(value)) if value < 0 else money(value)}</font>', base),
                ])
            # Net row
            net_color = '#16a34a' if net_value >= 0 else '#dc2626'
            table_data.append([
                Paragraph(f'<b>{net_label}</b>', label_b),
                Paragraph(f'<b><font color="{net_color}">{money(net_value)}</font></b>', label_b),
            ])

            t = Table(table_data, colWidths=[130*mm, 42*mm])
            style = TableStyle([
                # Header row
                ('BACKGROUND', (0, 0), (-1, 0), section_bg),
                ('SPAN', (0, 0), (-1, 0)),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('BOX', (0, 0), (-1, -1), 0.7, border),
                ('INNERGRID', (0, 0), (-1, -1), 0.3, border),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                # Net row styling
                ('BACKGROUND', (0, -1), (-1, -1), green_bg if net_value >= 0 else red_bg),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ])
            t.setStyle(style)
            return t

        elements = []

        # ── Header ───────────────────────────────────────────────────────────
        header_data = [
            [
                Paragraph(f'<b>KAPITA</b><br/>Cash Flow Statement', ParagraphStyle('KapitaHeader', parent=base, fontName='Helvetica-Bold', fontSize=10, textColor=brand, leading=16)),
                Paragraph(f'Period: {period_label}', ParagraphStyle('RightHeader', parent=base, fontName='Helvetica', fontSize=8, textColor=brand, alignment=2)),
            ],
            [
                Paragraph(f'<b>{business_name}</b><br/>{phone} | {email}', small),
                '',
            ],
        ]
        header_t = Table(header_data, colWidths=[80*mm, 102*mm])
        header_t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), section_bg),
            ('BOX', (0, 0), (-1, 0), 1.5, brand),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(header_t)
        elements.append(Spacer(1, 5*mm))

        # ── SECTION 1: Operating ─────────────────────────────────────────────
        operating_rows = [
            ('Cash Sales (Cash)', cash_sales),
            ('Cash Sales (Mobile Money)', mobile_sales),
            ('Credit Deposits Collected', credit_deposits),
            ('─── Inflow Total', total_inflows),
            ('Stock Purchases', -stock),
            ('Salaries & Wages', -salaries),
            ('Rent', -rent),
            ('Utilities', -utilities),
            ('Transport', -transport),
            ('Marketing', -marketing),
            ('Airtime', -airtime),
            ('Other Expenses', -other),
            ('Outgoing Payments', -outgoing),
            ('─── Outflow Total', -total_outflows),
        ]
        elements.append(section_table(
            '1. OPERATING ACTIVITIES',
            operating_rows,
            net_operating,
            'Net Cash from Operating Activities',
        ))
        elements.append(Spacer(1, 4*mm))

        # ── SECTION 2: Investing ─────────────────────────────────────────────
        elements.append(section_table(
            '2. INVESTING ACTIVITIES',
            [('Business Reinvestments', -reinvestments)],
            net_investing,
            'Net Cash from Investing Activities',
        ))
        elements.append(Spacer(1, 4*mm))

        # ── SECTION 3: Financing ─────────────────────────────────────────────
        elements.append(section_table(
            '3. FINANCING ACTIVITIES',
            [('Personal Withdrawals', -withdrawals)],
            net_financing,
            'Net Cash from Financing Activities',
        ))
        elements.append(Spacer(1, 5*mm))

        # ── NET CHANGE BOX ───────────────────────────────────────────────────
        net_color_hex = '#16a34a' if net_change >= 0 else '#dc2626'
        net_bg = green_bg if net_change >= 0 else red_bg
        sign = '+' if net_change >= 0 else ''
        net_summary = Table([
            [
                Paragraph('<b>NET CHANGE IN CASH POSITION</b>', ParagraphStyle('NetLabel', parent=base, fontName='Helvetica-Bold', fontSize=12)),
                Paragraph(f'<b><font color="{net_color_hex}">{sign}{money(net_change)}</font></b>', ParagraphStyle('NetVal', parent=base, fontName='Helvetica-Bold', fontSize=12, alignment=2)),
            ]
        ], colWidths=[130*mm, 42*mm])
        net_summary.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), net_bg),
            ('BOX', (0, 0), (-1, -1), 1, brand),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ]))
        elements.append(net_summary)
        elements.append(Spacer(1, 5*mm))

        # ── MEMO ─────────────────────────────────────────────────────────────
        memo_data = [
            [Paragraph('<b>SUPPLEMENTAL DISCLOSURES (Non-Cash)</b>', sub_heading), ''],
            [Paragraph('Credit Sales (awaiting collection)', base), Paragraph(money(credit_sales), base)],
            [Paragraph('Total Outstanding Receivables', base), Paragraph(money(outstanding), base)],
        ]
        memo_t = Table(memo_data, colWidths=[130*mm, 42*mm])
        memo_t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#eff6ff')),
            ('SPAN', (0, 0), (-1, 0)),
            ('BOX', (0, 0), (-1, -1), 0.7, border),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, border),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ]))
        elements.append(memo_t)
        elements.append(Spacer(1, 5*mm))

        # ── Footer ───────────────────────────────────────────────────────────
        generated_at = timezone.localtime().strftime('%d %b %Y %H:%M')
        elements.append(HRFlowable(width='100%', thickness=0.5, color=border))
        elements.append(Spacer(1, 2*mm))
        elements.append(Paragraph(
            f'Generated by Kapita on {generated_at} · {business_name} · This is a system-generated cash flow statement.',
            ParagraphStyle('Footer', parent=small, alignment=1, textColor=colors.HexColor('#6b7280'))
        ))

        doc.build(elements)
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="cashflow_{start.strftime("%Y%m%d")}_{end.strftime("%Y%m%d")}.pdf"'
        return response
