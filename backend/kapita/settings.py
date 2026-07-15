"""
Django settings for kapita project.
"""

from pathlib import Path
from datetime import timedelta
from decouple import config, AutoConfig
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Explicitly set decouple to look for .env in BASE_DIR (backend directory)
config = AutoConfig(search_path=BASE_DIR)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)
RENDER = config('RENDER', default=False, cast=bool)
VERCEL = config('VERCEL', default=False, cast=bool)

default_allowed_hosts = 'localhost,127.0.0.1'
if RENDER:
    default_allowed_hosts = f"{default_allowed_hosts},*.onrender.com,kapita-api-fbpp.onrender.com"
if VERCEL:
    default_allowed_hosts = f"{default_allowed_hosts},*.vercel.app"
# Add Kapita live domain
default_allowed_hosts = f"{default_allowed_hosts},kapita.online,www.kapita.online"

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default=default_allowed_hosts).split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    
    # Local apps
    'accounts',
    'billing',
    'personal_finance',
    'products',
    'sales',
    'customers',
    'credits',
    'expenses',
    'reinvestments',
    'notifications',
    'analytics',
    'chat',
    'promotions',
    'payments',
    'suppliers',
    'purchase_orders',
    'outgoing_payments',
    'quotations',
    'currencies',
    'invoices',
    'backup',
    'subscriptions',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'kapita.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'kapita.wsgi.application'

# Email configuration
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER)

# Database
# Priority: DATABASE_URL (Neon/Supabase/Railway) > DB_ENGINE config > local SQLite
DATABASE_URL = config('DATABASE_URL', default='')
DB_ENGINE = config('DB_ENGINE', default='sqlite3')

if DATABASE_URL and DATABASE_URL.strip():
    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            ssl_require=True,
        )
    }
elif DB_ENGINE == 'sqlite3':
    default_sqlite_path = '/var/data/db.sqlite3' if RENDER else str(BASE_DIR / 'db.sqlite3')
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': config('SQLITE_PATH', default=default_sqlite_path),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='kapita_db'),
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Lusaka'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
if RENDER:
    default_media_root = '/var/data/media'
elif VERCEL:
    default_media_root = '/tmp/media'  # Vercel uses /tmp for writable files
else:
    default_media_root = str(BASE_DIR / 'media')
MEDIA_ROOT = config('MEDIA_ROOT_PATH', default=default_media_root)

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    USE_X_FORWARDED_HOST = True

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://www.kapita.online",
    "https://kapita.online",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = DEBUG

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'billing.authentication.SubscriptionJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DATETIME_FORMAT': '%Y-%m-%d %H:%M:%S', # string formatting for the data-time fields.
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME', default=60, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(minutes=config('JWT_REFRESH_TOKEN_LIFETIME', default=1440, cast=int)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# CORS Settings
# CORS Settings
# Always add the live domains (with and without www)
def get_cors_origins():
    base_origins = config(
        'CORS_ALLOWED_ORIGINS',
        default='http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000'
    ).split(',')
    live_domains = [
        'https://kapita.online',
        'https://www.kapita.online',
        'https://kapita-2026.vercel.app'
    ]
    # Combine and deduplicate
    return list(dict.fromkeys([origin.strip() for origin in base_origins + live_domains if origin.strip()]))

CORS_ALLOWED_ORIGINS = get_cors_origins()

def get_csrf_origins():
    base_origins = config(
        'CSRF_TRUSTED_ORIGINS',
        default='http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000'
    ).split(',')
    live_domains = [
        'https://kapita.online',
        'https://www.kapita.online',
        'https://kapita-2026.vercel.app'
    ]
    # Combine and deduplicate
    return list(dict.fromkeys([origin.strip() for origin in base_origins + live_domains if origin.strip()]))

CSRF_TRUSTED_ORIGINS = get_csrf_origins()

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Email settings (Resend or Gmail)
EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.smtp.EmailBackend'
)
EMAIL_HOST = config('EMAIL_HOST', default='smtp.resend.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_TIMEOUT = 5  # 5 second timeout to prevent worker timeouts

# Use RESEND_API_KEY if available, otherwise use EMAIL_HOST_PASSWORD
resend_key = config('RESEND_API_KEY', default='')
if resend_key:
    EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='apikey')
    EMAIL_HOST_PASSWORD = resend_key
else:
    EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
    
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@kapita.online')

# Frontend URL for verification links
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

# OpenRouter / OpenAI-compatible AI (Mumu chat + analytics proxy)
OPENROUTER_API_KEY = config('OPENROUTER_API_KEY', default='')
OPENROUTER_BASE_URL = config('OPENROUTER_BASE_URL', default='https://openrouter.ai/api/v1')
OPENROUTER_MODEL = config('OPENROUTER_MODEL', default='google/gemini-2.5-flash')
OPENROUTER_FALLBACK_MODELS = config(
    'OPENROUTER_FALLBACK_MODELS',
    default='google/gemini-1.5-flash,openai/gpt-4o-mini,anthropic/claude-3.5-haiku',
)
OPENROUTER_SITE_URL = config('OPENROUTER_SITE_URL', default='http://localhost:3000')
# Legacy names still supported as fallbacks
OPENAI_API_KEY = config('OPENAI_API_KEY', default='')
OPENAI_ROUTER_URL = config('OPENAI_ROUTER_URL', default='https://openrouter.ai/api/v1')
