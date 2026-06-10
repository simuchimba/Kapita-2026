from calendar import month_abbr
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone

from .models import PaymentSubmission, ActivityLog
from .utils import access_status

User = get_user_model()


def _month_label(dt):
    if dt is None:
        return ''
    return f"{month_abbr[dt.month]} {dt.year}"


def build_signups_trend(months=6):
    today = timezone.now()
    start = today - timedelta(days=months * 31)
    rows = (
        User.objects.filter(date_joined__gte=start)
        .annotate(month=TruncMonth('date_joined'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    by_month = {}
    for row in rows:
        if not row['month']:
            continue
        month_val = row['month'].date() if hasattr(row['month'], 'date') else row['month']
        by_month[month_val.replace(day=1)] = row['count']

    trend = []
    cursor = today.date().replace(day=1)
    for _ in range(months):
        trend.append({
            'month': _month_label(cursor),
            'signups': by_month.get(cursor, 0),
        })
        if cursor.month == 1:
            cursor = cursor.replace(year=cursor.year - 1, month=12)
        else:
            cursor = cursor.replace(month=cursor.month - 1)
    trend.reverse()
    return trend


def build_payments_trend(months=6):
    today = timezone.now()
    start = today - timedelta(days=months * 31)
    rows = (
        PaymentSubmission.objects.filter(
            status=PaymentSubmission.STATUS_APPROVED,
            reviewed_at__gte=start,
        )
        .annotate(month=TruncMonth('reviewed_at'))
        .values('month')
        .annotate(count=Count('id'), revenue=Sum('amount'))
        .order_by('month')
    )
    by_month = {}
    for row in rows:
        if not row['month']:
            continue
        month_val = row['month'].date() if hasattr(row['month'], 'date') else row['month']
        by_month[month_val.replace(day=1)] = {
            'count': row['count'],
            'revenue': float(row['revenue'] or 0),
        }

    trend = []
    cursor = today.date().replace(day=1)
    for _ in range(months):
        data = by_month.get(cursor, {'count': 0, 'revenue': 0})
        trend.append({
            'month': _month_label(cursor),
            'approved': data['count'],
            'revenue': data['revenue'],
        })
        if cursor.month == 1:
            cursor = cursor.replace(year=cursor.year - 1, month=12)
        else:
            cursor = cursor.replace(month=cursor.month - 1)
    trend.reverse()
    return trend


def build_activity_trend(days=14):
    today = timezone.localdate()
    start = today - timedelta(days=days - 1)
    rows = (
        ActivityLog.objects.filter(created_at__date__gte=start)
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(count=Count('id'))
        .order_by('day')
    )
    by_day = {row['day']: row['count'] for row in rows}

    trend = []
    for i in range(days):
        day = start + timedelta(days=i)
        trend.append({
            'day': day.strftime('%b %d'),
            'events': by_day.get(day, 0),
        })
    return trend


def build_status_distribution():
    trial = subscription = expired = pending = 0
    for user in User.objects.filter(is_staff=False, is_superuser=False):
        status_value = access_status(user)
        if status_value == 'active_trial':
            trial += 1
        elif status_value == 'active_subscription':
            subscription += 1
        elif status_value == 'pending_payment_verification':
            pending += 1
        else:
            expired += 1

    return [
        {'name': 'Active Trial', 'value': trial, 'fill': '#eab308'},
        {'name': 'Active Subscription', 'value': subscription, 'fill': '#10b981'},
        {'name': 'Pending Payment', 'value': pending, 'fill': '#3b82f6'},
        {'name': 'Expired', 'value': expired, 'fill': '#ef4444'},
    ]


def build_payment_status_chart():
    counts = PaymentSubmission.objects.values('status').annotate(count=Count('id'))
    color_map = {
        PaymentSubmission.STATUS_PENDING: '#3b82f6',
        PaymentSubmission.STATUS_APPROVED: '#10b981',
        PaymentSubmission.STATUS_REJECTED: '#ef4444',
    }
    label_map = {
        PaymentSubmission.STATUS_PENDING: 'Pending',
        PaymentSubmission.STATUS_APPROVED: 'Approved',
        PaymentSubmission.STATUS_REJECTED: 'Rejected',
    }
    return [
        {
            'name': label_map.get(row['status'], row['status']),
            'value': row['count'],
            'fill': color_map.get(row['status'], '#94a3b8'),
        }
        for row in counts
        if row['count'] > 0
    ]


def build_admin_chart_payload():
    total_revenue = PaymentSubmission.objects.filter(
        status=PaymentSubmission.STATUS_APPROVED
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

    return {
        'status_distribution': build_status_distribution(),
        'payment_status_chart': build_payment_status_chart(),
        'signups_trend': build_signups_trend(),
        'payments_trend': build_payments_trend(),
        'activity_trend': build_activity_trend(),
        'total_revenue': float(total_revenue),
        'total_payments': PaymentSubmission.objects.count(),
    }
