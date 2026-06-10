import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class OpenAIError(RuntimeError):
    pass


def _api_key():
    for name in ('OPENROUTER_API_KEY', 'OPENAI_API_KEY'):
        key = (getattr(settings, name, '') or '').strip()
        if key and not key.startswith('your-'):
            return key
    return ''


def _base_url():
    url = (
        getattr(settings, 'OPENROUTER_BASE_URL', '')
        or getattr(settings, 'OPENAI_ROUTER_URL', '')
        or 'https://openrouter.ai/api/v1'
    )
    return url.rstrip('/')


def _candidate_models(primary):
    configured = getattr(settings, 'OPENROUTER_FALLBACK_MODELS', '')
    configured_models = [m.strip() for m in str(configured).split(',') if m.strip()]
    defaults = [
        'google/gemini-2.5-flash',
        'google/gemini-1.5-flash',
        'openai/gpt-4o-mini',
        'anthropic/claude-3.5-haiku',
    ]

    seen = set()
    ordered = []
    for model_name in [primary, *configured_models, *defaults]:
        key = model_name.lower()
        if key in seen:
            continue
        seen.add(key)
        ordered.append(model_name)
    return ordered


def _is_model_unavailable(detail):
    text = (detail or '').lower()
    return (
        'no endpoints found for' in text
        or 'model not found' in text
        or ('no endpoint' in text and 'model' in text)
    )


def call_openai_responses(payload: dict, model: str = "gpt-4o-mini", timeout: int = 30) -> dict:
    """Call the OpenAI Router Responses API via server-side proxy.

    Args:
        payload: dict payload to send as the body for the Responses API.
        model: model name to send.
        timeout: request timeout in seconds.

    Returns:
        dict: parsed JSON response.

    Raises:
        OpenAIError on non-2xx responses or configuration issues.
    """
    api_key = _api_key()
    if not api_key:
        raise OpenAIError('OPENROUTER_API_KEY or OPENAI_API_KEY is not configured')

    url = f"{_base_url()}/responses"
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'HTTP-Referer': getattr(settings, 'OPENROUTER_SITE_URL', 'http://localhost:3000'),
        'X-Title': 'Kapita Analytics AI',
    }

    models = _candidate_models(model)
    last_error = ''

    for index, model_name in enumerate(models):
        body = {
            'model': model_name,
            **payload,
        }

        try:
            resp = requests.post(url, json=body, headers=headers, timeout=timeout)
            resp.raise_for_status()
            try:
                return resp.json()
            except ValueError:
                raise OpenAIError('Invalid JSON returned from AI provider')
        except requests.RequestException as exc:
            detail = ''
            if exc.response is not None:
                try:
                    detail = exc.response.json().get('error', {}).get('message', '')
                except ValueError:
                    detail = exc.response.text[:200]

            last_error = detail or str(exc)
            can_retry = _is_model_unavailable(last_error) and index < len(models) - 1
            if can_retry:
                logger.warning('AI model %s unavailable, trying fallback model.', model_name)
                continue

            logger.exception('AI responses request failed')
            raise OpenAIError(last_error) from exc

    raise OpenAIError(last_error or 'No model endpoint is currently available.')
