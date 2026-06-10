from datetime import timedelta

from django.utils import timezone

from .models import PaymentSubmission, Subscription, ActivityLog

TRIAL_DAYS = 7
SUBSCRIPTION_DAYS = 30


def trial_end_date(user):
    joined = timezone.localdate(user.date_joined)
    return joined + timedelta(days=TRIAL_DAYS)


def latest_active_subscription(user):
    today = timezone.localdate()
    return user.subscriptions.filter(status=Subscription.STATUS_ACTIVE, end_date__gte=today).order_by('-end_date', '-created_at').first()


def latest_payment(user):
    return user.payment_submissions.filter(status=PaymentSubmission.STATUS_APPROVED).order_by('-reviewed_at', '-created_at').first()


def pending_payment(user):
    return user.payment_submissions.filter(status=PaymentSubmission.STATUS_PENDING).order_by('-created_at').first()


def access_status(user):
    if not user.is_active:
        return 'inactive'

    if user.is_staff or user.is_superuser:
        return 'active_subscription'

    today = timezone.localdate()
    subscription = latest_active_subscription(user)
    if subscription:
        return 'active_subscription'

    if trial_end_date(user) >= today:
        return 'active_trial'

    if pending_payment(user):
        return 'pending_payment_verification'

    return 'expired'


def expiry_date(user):
    subscription = latest_active_subscription(user)
    if subscription:
        return subscription.end_date
    return trial_end_date(user)


def days_remaining(user):
    today = timezone.localdate()
    expiry = expiry_date(user)
    if expiry < today:
        return 0
    return (expiry - today).days


def expire_stale_subscriptions():
    """Mark active subscriptions past end_date as expired. Returns count updated."""
    today = timezone.localdate()
    stale = Subscription.objects.filter(status=Subscription.STATUS_ACTIVE, end_date__lt=today)
    count = 0
    for subscription in stale.select_related('user'):
        subscription.status = Subscription.STATUS_EXPIRED
        subscription.save(update_fields=['status', 'updated_at'])
        ActivityLog.objects.create(
            actor=None,
            target_user=subscription.user,
            action='subscription_expired',
            details={'subscription_id': subscription.id, 'end_date': str(subscription.end_date)},
        )
        from .notifications import simulate_email_notification
        simulate_email_notification(
            user=subscription.user,
            subject='Kapita subscription expired',
            message='Your subscription has ended. Submit payment proof to renew access for 30 days.',
        )
        count += 1
    return count


def access_summary(user):
    subscription = latest_active_subscription(user)
    trial_end = trial_end_date(user)
    status = access_status(user)
    expiry = expiry_date(user)
    last_payment = latest_payment(user)
    pending = pending_payment(user)

    return {
        'access_status': status,
        'trial_end_date': trial_end,
        'subscription_end_date': subscription.end_date if subscription else None,
        'expiry_date': expiry,
        'days_remaining': days_remaining(user),
        'is_trial_active': status == 'active_trial',
        'is_subscription_active': status == 'active_subscription',
        'is_expired': status == 'expired',
        'is_pending_payment': status == 'pending_payment_verification',
        'last_payment_date': last_payment.reviewed_at if last_payment and last_payment.reviewed_at else None,
        'pending_payment_id': pending.id if pending else None,
    }
