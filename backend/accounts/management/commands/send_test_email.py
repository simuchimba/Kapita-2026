from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings


class Command(BaseCommand):
    help = 'Send test email'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Sending test email...'))
        
        try:
            send_mail(
                'Kapita Email Test',
                'This is a test email from Kapita to verify email sending is working!',
                settings.DEFAULT_FROM_EMAIL,
                [settings.DEFAULT_FROM_EMAIL],
                fail_silently=False,
            )
            self.stdout.write(self.style.SUCCESS('Successfully sent test email!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to send email: {e}'))
