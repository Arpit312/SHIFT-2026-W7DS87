import os
from pathlib import Path
import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False)
)

environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = env('SECRET_KEY', default='django-insecure-dummy-key')
DEBUG = env('DEBUG', default=True)
PHOTO_CHECK_BACKEND = env('PHOTO_CHECK_BACKEND', default='mock')

# ChargeSathi chatbot. GEMINI_API_KEY is shared with Photo Check; CHATBOT_MODEL is not.
GEMINI_API_KEY = env('GEMINI_API_KEY', default='')
CHATBOT_MODEL = env('CHATBOT_MODEL', default='gemini-3.8-flash')
CHATBOT_TIMEOUT_SECONDS = env.int('CHATBOT_TIMEOUT_SECONDS', default=25)
CHATBOT_RATE_LIMIT_PER_MINUTE = env.int('CHATBOT_RATE_LIMIT_PER_MINUTE', default=20)
CHATBOT_MAX_OUTPUT_TOKENS = env.int('CHATBOT_MAX_OUTPUT_TOKENS', default=1024)
CHATBOT_MAX_MESSAGE_CHARS = env.int('CHATBOT_MAX_MESSAGE_CHARS', default=2000)
CHATBOT_MAX_HISTORY_TURNS = env.int('CHATBOT_MAX_HISTORY_TURNS', default=12)
CHATBOT_THINKING_BUDGET = env.int('CHATBOT_THINKING_BUDGET', default=0)

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'corsheaders',

    'core',
    'accounts',
    'societies',
    'charging_requests',
    'evidence',
    'assessments',
    'conditions',
    'scheduling',
    'billing',
    'packets',
    'activity',
    'chatbot',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'chargenoc.urls'

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

WSGI_APPLICATION = 'chargenoc.wsgi.application'

DATABASES = {
    'default': env.db('DATABASE_URL', default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}")
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'core.authentication.SupabaseAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.StandardPagination',
    'PAGE_SIZE': 10,
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler'
}

CORS_ALLOW_ALL_ORIGINS = True

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'chargenoc-default',
    }
}
