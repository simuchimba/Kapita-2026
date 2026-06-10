from urllib.parse import urlencode

from django.urls import reverse


def build_payment_proof_url(request, payment_id):
    """Build an authenticated URL for payment proof images (works in <img> tags)."""
    if request is None:
        return reverse('billing-payment-proof', kwargs={'payment_id': payment_id})

    path = reverse('billing-payment-proof', kwargs={'payment_id': payment_id})
    url = request.build_absolute_uri(path)

    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1]
        url = f'{url}?{urlencode({"token": token})}'

    return url
