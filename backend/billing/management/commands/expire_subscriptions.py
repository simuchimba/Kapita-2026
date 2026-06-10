from django.core.management.base import BaseCommand

from billing.utils import expire_stale_subscriptions


class Command(BaseCommand):
    help = 'Mark subscriptions past end_date as expired and log activity.'

    def handle(self, *args, **options):
        count = expire_stale_subscriptions()
        self.stdout.write(self.style.SUCCESS(f'Expired {count} subscription(s).'))
