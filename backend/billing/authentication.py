from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

from .utils import access_status

EXEMPT_PATH_PREFIXES = (
    '/api/auth/login/',
    '/api/auth/register/',
    '/api/auth/token/refresh/',
    '/api/auth/me/',
    '/api/auth/profile/',
    '/api/auth/receipt-settings/',
    '/api/auth/change-password/',
    '/api/billing/submit-proof/',
    '/api/billing/me/',
    '/api/billing/history/',
    '/api/billing/proof/',
)


class SubscriptionJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if not result:
            return None

        user, token = result
        path = getattr(request, 'path_info', '') or getattr(request, 'path', '') or ''

        if user.is_staff or user.is_superuser:
            return user, token

        if path.startswith(EXEMPT_PATH_PREFIXES):
            return user, token

        status = access_status(user)
        if status in ('active_trial', 'active_subscription'):
            return user, token

        raise AuthenticationFailed('Your trial or subscription has expired. Please submit payment proof to regain access.')
