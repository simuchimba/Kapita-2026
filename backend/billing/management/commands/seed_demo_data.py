from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from billing.models import PaymentSubmission, Subscription, ActivityLog
from billing.utils import trial_end_date

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed demo users and billing records for admin dashboard testing.'

    def handle(self, *args, **options):
        demo_users = [
            ('trial_user', 'trial@demo.app', 2),
            ('active_subscriber', 'subscriber@demo.app', 0),
            ('expired_user', 'expired@demo.app', -10),
            ('pending_payment', 'pending@demo.app', -8),
        ]

        for username, email, days_offset in demo_users:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'business_name': f'{username} Business',
                    'is_staff': False,
                },
            )
            if created:
                user.set_password('demo12345')
                user.save()
                ActivityLog.objects.create(
                    target_user=user,
                    action='trial_started',
                    details={'trial_end_date': str(trial_end_date(user))},
                )

            if username == 'active_subscriber':
                Subscription.objects.get_or_create(
                    user=user,
                    status=Subscription.STATUS_ACTIVE,
                    defaults={
                        'start_date': timezone.localdate(),
                        'end_date': timezone.localdate() + timedelta(days=25),
                        'notes': 'Demo active subscription',
                    },
                )
            elif username == 'expired_user':
                user.date_joined = timezone.now() - timedelta(days=30)
                user.save(update_fields=['date_joined'])
            elif username == 'pending_payment':
                user.date_joined = timezone.now() - timedelta(days=10)
                user.save(update_fields=['date_joined'])
                if not PaymentSubmission.objects.filter(user=user, status=PaymentSubmission.STATUS_PENDING).exists():
                    PaymentSubmission.objects.create(
                        user=user,
                        transaction_id=f'DEMO-TX-{user.id}',
                        amount=Decimal('29.99'),
                        notes='Demo pending payment',
                        status=PaymentSubmission.STATUS_PENDING,
                    )

        self.stdout.write(self.style.SUCCESS('Demo billing data seeded. User passwords: demo12345'))
