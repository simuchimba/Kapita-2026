import logging

logger = logging.getLogger(__name__)


def simulate_email_notification(*, user, subject, message):
    """Log a simulated email notification (MVP — no SMTP)."""
    recipient = getattr(user, 'email', None) or getattr(user, 'username', 'user')
    logger.info('[Kapita Email Simulation] To=%s | Subject=%s | %s', recipient, subject, message)
