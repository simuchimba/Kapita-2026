import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def simulate_email_notification(*, user, subject, message):
    """Send a transactional email notification (falls back to a log line if email isn't configured)."""
    recipient = getattr(user, 'email', None)
    if not recipient:
        logger.warning('[Kapita Email] No email on file for user=%s | Subject=%s', getattr(user, 'username', 'user'), subject)
        return

    if not settings.EMAIL_HOST_PASSWORD:
        logger.info('[Kapita Email Simulation] To=%s | Subject=%s | %s', recipient, subject, message)
        return

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [recipient],
            fail_silently=False,
        )
    except Exception:
        logger.exception('[Kapita Email] Failed to send "%s" to %s', subject, recipient)
