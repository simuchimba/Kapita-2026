"""Clerk session verification and Django user sync."""

import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction

User = get_user_model()
logger = logging.getLogger(__name__)
_clerk_client = None


def get_clerk_client():
    global _clerk_client
    if _clerk_client is None and settings.CLERK_SECRET_KEY:
        from clerk_backend_api import Clerk

        _clerk_client = Clerk(bearer_auth=settings.CLERK_SECRET_KEY)
    return _clerk_client


def _primary_email(clerk_user):
    if not clerk_user:
        return None
    for entry in getattr(clerk_user, 'email_addresses', []) or []:
        if getattr(entry, 'id', None) == getattr(clerk_user, 'primary_email_address_id', None):
            return getattr(entry, 'email_address', None)
    if clerk_user.email_addresses:
        return clerk_user.email_addresses[0].email_address
    return None


def _email_from_payload(payload):
    if not payload:
        return None
    for key in ('email', 'email_address', 'primary_email_address'):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, dict):
            nested = value.get('email_address') or value.get('email')
            if nested:
                return nested.strip()
    return None


def _unique_username(base):
    candidate = (base or 'user').split('@')[0][:140] or 'user'
    username = candidate
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f'{candidate}{counter}'
        counter += 1
    return username


def _find_user_by_clerk_id(clerk_id):
    return User.objects.filter(clerk_id=clerk_id).first()


def _find_user_by_email(email):
    if not email:
        return None
    return User.objects.filter(email__iexact=email.strip()).first()


def _apply_clerk_profile(user, *, first_name='', last_name=''):
    updates = []
    if first_name and not user.first_name:
        user.first_name = first_name
        updates.append('first_name')
    if last_name and not user.last_name:
        user.last_name = last_name
        updates.append('last_name')
    if updates:
        updates.append('updated_at')
        user.save(update_fields=updates)


def link_user_to_clerk(user, clerk_id, *, first_name='', last_name=''):
    """Attach a Clerk account to an existing Kapita user."""
    if user.clerk_id == clerk_id:
        _apply_clerk_profile(user, first_name=first_name, last_name=last_name)
        set_clerk_kapita_metadata(clerk_id, user)
        return user

    if User.objects.filter(clerk_id=clerk_id).exclude(pk=user.pk).exists():
        raise IntegrityError(f'Clerk id {clerk_id} is already linked to another Kapita user.')

    user.clerk_id = clerk_id
    _apply_clerk_profile(user, first_name=first_name, last_name=last_name)
    user.save(update_fields=['clerk_id', 'first_name', 'last_name', 'updated_at'])
    set_clerk_kapita_metadata(clerk_id, user)
    return user


def set_clerk_kapita_metadata(clerk_id, kapita_user):
    """Store Kapita user id on Clerk so sign-in always restores the original account."""
    client = get_clerk_client()
    if not client or not clerk_id or not kapita_user:
        return
    try:
        client.users.update(
            user_id=clerk_id,
            public_metadata={
                'kapita_user_id': kapita_user.id,
                'kapita_email': kapita_user.email,
            },
        )
    except Exception as exc:
        logger.warning('Failed to set Clerk metadata for %s: %s', clerk_id, exc)


def _find_user_by_clerk_metadata(clerk_user):
    if not clerk_user:
        return None
    metadata = getattr(clerk_user, 'public_metadata', None) or {}
    if not isinstance(metadata, dict):
        return None
    kapita_id = metadata.get('kapita_user_id')
    if not kapita_id:
        return None
    try:
        return User.objects.filter(pk=int(kapita_id)).first()
    except (TypeError, ValueError):
        return None


def fetch_clerk_user(clerk_id):
    client = get_clerk_client()
    if not client:
        return None
    try:
        return client.users.get(user_id=clerk_id)
    except Exception as exc:
        logger.warning('Failed to fetch Clerk user %s: %s', clerk_id, exc)
        return None


def sync_user_from_clerk(clerk_id, payload=None):
    """Return a Django user linked to this Clerk account, creating or linking by email."""
    existing = _find_user_by_clerk_id(clerk_id)
    if existing:
        return existing

    payload = payload or {}
    email = _email_from_payload(payload)
    first_name = payload.get('first_name') or ''
    last_name = payload.get('last_name') or ''

    clerk_user = fetch_clerk_user(clerk_id)
    if clerk_user:
        if not email:
            email = _primary_email(clerk_user)
        first_name = clerk_user.first_name or first_name
        last_name = clerk_user.last_name or last_name

        # Pre-synced accounts: always restore the original Kapita user + data
        kapita_user = _find_user_by_clerk_metadata(clerk_user)
        if kapita_user:
            return link_user_to_clerk(
                kapita_user,
                clerk_id,
                first_name=first_name,
                last_name=last_name,
            )

    kapita_user = _find_user_by_email(email)
    if kapita_user:
        return link_user_to_clerk(
            kapita_user,
            clerk_id,
            first_name=first_name,
            last_name=last_name,
        )

    username = _unique_username(email or clerk_id.replace('user_', ''))
    email_value = email or f'{clerk_id}@users.clerk.local'

    user = User(
        clerk_id=clerk_id,
        email=email_value,
        username=username,
        first_name=first_name,
        last_name=last_name,
    )
    user.set_unusable_password()

    try:
        with transaction.atomic():
            user.save()
    except IntegrityError:
        linked = _find_user_by_clerk_id(clerk_id) or _find_user_by_email(email)
        if linked:
            return link_user_to_clerk(linked, clerk_id, first_name=first_name, last_name=last_name)
        raise

    return user


def authenticate_clerk_user(request):
    """Verify Clerk session token and return (django_user, clerk_state) or None."""
    if not settings.CLERK_SECRET_KEY:
        return None

    from clerk_backend_api import AuthenticateRequestOptions, authenticate_request

    options_kwargs = {
        'secret_key': settings.CLERK_SECRET_KEY,
        'accepts_token': ['session_token'],
    }
    if settings.CLERK_AUTHORIZED_PARTIES:
        options_kwargs['authorized_parties'] = settings.CLERK_AUTHORIZED_PARTIES
    if settings.CLERK_JWT_KEY:
        options_kwargs['jwt_key'] = settings.CLERK_JWT_KEY

    try:
        state = authenticate_request(request, AuthenticateRequestOptions(**options_kwargs))
    except Exception as exc:
        logger.warning('Clerk request authentication failed: %s', exc)
        return None

    if not state.is_signed_in:
        return None

    clerk_id = state.payload.get('sub')
    if not clerk_id:
        return None

    try:
        user = sync_user_from_clerk(clerk_id, state.payload)
    except Exception as exc:
        logger.exception('Failed to sync Clerk user %s', clerk_id)
        return None

    return user, state
