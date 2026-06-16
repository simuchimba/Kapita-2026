import logging
import json

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class OpenRouterError(RuntimeError):
    pass


def _api_key():
    for name in ('OPENROUTER_API_KEY', 'OPENAI_API_KEY'):
        key = (getattr(settings, name, '') or '').strip()
        if key and not key.startswith('your-'):
            return key
    return None


def _base_url():
    url = (
        getattr(settings, 'OPENROUTER_BASE_URL', '')
        or getattr(settings, 'OPENAI_ROUTER_URL', '')
        or 'https://openrouter.ai/api/v1'
    )
    return url.rstrip('/')


def _model():
    return getattr(settings, 'OPENROUTER_MODEL', 'google/gemini-2.0-flash-001')


def _tts_model():
    return getattr(settings, 'OPENROUTER_TTS_MODEL', 'openai/tts-1')


def _stt_model():
    return getattr(settings, 'OPENROUTER_STT_MODEL', 'openai/whisper-1')


def _voice():
    return getattr(settings, 'OPENROUTER_VOICE', 'alloy')


def _candidate_models():
    configured = getattr(settings, 'OPENROUTER_FALLBACK_MODELS', '')
    extra_models = [m.strip() for m in str(configured).split(',') if m.strip()]
    defaults = [
        'google/gemini-2.5-flash',
        'google/gemini-1.5-flash',
        'openai/gpt-4o-mini',
        'anthropic/claude-3.5-haiku',
    ]

    seen = set()
    ordered = []
    for model_name in [_model(), *extra_models, *defaults]:
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


def chat_completion(*, system_prompt, user_message, messages=None, max_tokens=1024):
    """Send a chat request via OpenRouter (OpenAI-compatible API)."""
    api_key = _api_key()
    if not api_key:
        raise OpenRouterError(
            'OpenRouter API key is not configured. Set OPENROUTER_API_KEY in backend/.env'
        )

    url = f'{_base_url()}/chat/completions'
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'HTTP-Referer': getattr(settings, 'OPENROUTER_SITE_URL', 'http://localhost:3000'),
        'X-Title': 'Kapita Mumu',
    }
    history = []
    for message in messages or []:
        if not isinstance(message, dict):
            continue
        role = (message.get('role') or '').strip()
        content = (message.get('content') or '').strip()
        if role in {'user', 'assistant'} and content:
            history.append({'role': role, 'content': content})

    base_body = {
        'messages': [{'role': 'system', 'content': system_prompt}, *history],
        'max_tokens': max_tokens,
    }

    last_error = ''
    for index, model_name in enumerate(_candidate_models()):
        body = {'model': model_name, **base_body}

        try:
            response = requests.post(url, json=body, headers=headers, timeout=60)
            response.raise_for_status()
            data = response.json()

            try:
                return data['choices'][0]['message']['content']
            except (KeyError, IndexError, TypeError) as exc:
                raise OpenRouterError('Unexpected response from OpenRouter') from exc

        except requests.RequestException as exc:
            detail = ''
            if exc.response is not None:
                try:
                    detail = exc.response.json().get('error', {}).get('message', '')
                except ValueError:
                    detail = exc.response.text[:200]

            last_error = detail or str(exc)
            can_retry = _is_model_unavailable(last_error) and index < len(_candidate_models()) - 1
            if can_retry:
                logger.warning('OpenRouter model %s unavailable, trying fallback model.', model_name)
                continue

            logger.exception('OpenRouter request failed')
            raise OpenRouterError(last_error) from exc

    raise OpenRouterError(last_error or 'No OpenRouter model is currently available.')


def chat_completion_stream(*, system_prompt, user_message, messages=None, max_tokens=1024):
    """Stream a chat request via OpenRouter (OpenAI-compatible API)."""
    api_key = _api_key()
    if not api_key:
        raise OpenRouterError(
            'OpenRouter API key is not configured. Set OPENROUTER_API_KEY in backend/.env'
        )

    url = f'{_base_url()}/chat/completions'
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'HTTP-Referer': getattr(settings, 'OPENROUTER_SITE_URL', 'http://localhost:3000'),
        'X-Title': 'Kapita Mumu',
    }
    history = []
    for message in messages or []:
        if not isinstance(message, dict):
            continue
        role = (message.get('role') or '').strip()
        content = (message.get('content') or '').strip()
        if role in {'user', 'assistant'} and content:
            history.append({'role': role, 'content': content})

    base_body = {
        'messages': [{'role': 'system', 'content': system_prompt}, *history],
        'max_tokens': max_tokens,
        'stream': True,
    }

    last_error = ''
    for index, model_name in enumerate(_candidate_models()):
        body = {'model': model_name, **base_body}

        try:
            response = requests.post(url, json=body, headers=headers, timeout=60, stream=True)
            response.raise_for_status()
            return response

        except requests.RequestException as exc:
            detail = ''
            if exc.response is not None:
                try:
                    detail = exc.response.json().get('error', {}).get('message', '')
                except ValueError:
                    detail = exc.response.text[:200]

            last_error = detail or str(exc)
            can_retry = _is_model_unavailable(last_error) and index < len(_candidate_models()) - 1
            if can_retry:
                logger.warning('OpenRouter model %s unavailable, trying fallback model.', model_name)
                continue

            logger.exception('OpenRouter streaming request failed')
            raise OpenRouterError(last_error) from exc

    raise OpenRouterError(last_error or 'No OpenRouter model is currently available.')


def text_to_speech(text):
    """Convert text to speech using OpenRouter/OpenAI TTS API"""
    api_key = _api_key()
    if not api_key:
        raise OpenRouterError(
            'OpenRouter API key is not configured. Set OPENROUTER_API_KEY in backend/.env'
        )

    url = f'{_base_url()}/audio/speech'
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'HTTP-Referer': getattr(settings, 'OPENROUTER_SITE_URL', 'http://localhost:3000'),
        'X-Title': 'Kapita Mumu',
    }
    body = {
        'model': _tts_model(),
        'input': text,
        'voice': _voice(),
    }
    try:
        response = requests.post(url, json=body, headers=headers, timeout=60)
        response.raise_for_status()
        return response.content
    except requests.RequestException as exc:
        logger.exception('OpenRouter TTS request failed')
        raise OpenRouterError(str(exc)) from exc


def speech_to_text(audio_bytes, filename='audio.webm'):
    """Convert speech to text using OpenRouter/OpenAI Whisper API"""
    api_key = _api_key()
    if not api_key:
        raise OpenRouterError(
            'OpenRouter API key is not configured. Set OPENROUTER_API_KEY in backend/.env'
        )

    url = f'{_base_url()}/audio/transcriptions'
    headers = {
        'Authorization': f'Bearer {api_key}',
        'HTTP-Referer': getattr(settings, 'OPENROUTER_SITE_URL', 'http://localhost:3000'),
        'X-Title': 'Kapita Mumu',
    }
    files = {'file': (filename, audio_bytes, 'audio/webm')}
    data = {'model': _stt_model()}
    try:
        response = requests.post(url, files=files, data=data, headers=headers, timeout=60)
        response.raise_for_status()
        return response.json().get('text', '')
    except requests.RequestException as exc:
        logger.exception('OpenRouter STT request failed')
        raise OpenRouterError(str(exc)) from exc
