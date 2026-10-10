from unittest.mock import MagicMock, patch
from urllib.error import HTTPError, URLError
from io import BytesIO

from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from accounts.models import Profile
from societies.models import Society


@override_settings(
    GEMINI_API_KEY='test-gemini-secret-do-not-leak',
    CHATBOT_MODEL='gemini-test-model',
    CHATBOT_RATE_LIMIT_PER_MINUTE=20,
    CHATBOT_MAX_MESSAGE_CHARS=2000,
    CHATBOT_MAX_HISTORY_TURNS=12,
    CHATBOT_TIMEOUT_SECONDS=5,
    CHATBOT_MAX_OUTPUT_TOKENS=256,
    CACHES={
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'chatbot-tests',
        }
    },
)
class ChatEndpointTests(APITestCase):
    url = '/api/v1/chat/'

    def setUp(self):
        self.society = Society.objects.create(
            name='Test Society',
            address='1 Test Road',
            registration_number='REG-TEST',
        )
        self.owner = Profile.objects.create(
            supabase_user_id='owner-chat-1',
            role='ev_owner',
            full_name='Owner One',
            society=self.society,
            flat_number='101',
        )
        self.rwa = Profile.objects.create(
            supabase_user_id='rwa-chat-1',
            role='rwa_admin',
            full_name='RWA One',
            society=self.society,
        )
        cache.clear()

    def test_unauthenticated_rejected(self):
        response = self.client.post(self.url, {'message': 'Hello'}, format='json')
        self.assertEqual(response.status_code, 401)
        body = response.json()
        self.assertNotIn('test-gemini-secret-do-not-leak', str(body))

    def test_non_owner_rejected(self):
        self.client.force_authenticate(user=self.rwa)
        response = self.client.post(self.url, {'message': 'Hello'}, format='json')
        self.assertEqual(response.status_code, 403)
        self.assertNotIn('test-gemini-secret-do-not-leak', str(response.json()))

    def test_empty_message_rejected(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(self.url, {'message': '   '}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json().get('code'), 'invalid_input')

    def test_message_too_long_rejected(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            self.url,
            {'message': 'x' * 2001},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json().get('code'), 'invalid_input')

    def test_history_too_long_rejected(self):
        self.client.force_authenticate(user=self.owner)
        history = [{'role': 'user', 'content': 'hi'}] * 13
        response = self.client.post(
            self.url,
            {'message': 'next', 'history': history},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json().get('code'), 'invalid_input')

    @override_settings(CHATBOT_RATE_LIMIT_PER_MINUTE=2)
    @patch('chatbot.views.call_gemini')
    def test_rate_limit(self, mock_call):
        mock_call.return_value = {'reply': 'General charging guidance.', 'severity': 'low'}
        self.client.force_authenticate(user=self.owner)
        ok1 = self.client.post(self.url, {'message': 'one'}, format='json')
        ok2 = self.client.post(self.url, {'message': 'two'}, format='json')
        limited = self.client.post(self.url, {'message': 'three'}, format='json')
        self.assertEqual(ok1.status_code, 200)
        self.assertEqual(ok2.status_code, 200)
        self.assertEqual(limited.status_code, 429)
        self.assertEqual(limited.json().get('code'), 'rate_limited')

    @patch('chatbot.services.urllib.request.urlopen')
    def test_provider_failure_clean_error(self, mock_open):
        mock_open.side_effect = URLError('simulated provider down')
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(self.url, {'message': 'Why is charging slow?'}, format='json')
        self.assertEqual(response.status_code, 502)
        body = response.json()
        self.assertEqual(body.get('code'), 'provider_error')
        self.assertIn('Try again', body.get('detail', ''))
        dumped = str(body)
        self.assertNotIn('test-gemini-secret-do-not-leak', dumped)
        self.assertNotIn('x-goog-api-key', dumped)

    @patch('chatbot.services.urllib.request.urlopen')
    def test_provider_http_error_does_not_leak_secret(self, mock_open):
        err = HTTPError(
            url='https://generativelanguage.googleapis.com/v1beta/models/x',
            code=403,
            msg='Forbidden',
            hdrs=None,
            fp=BytesIO(b'{"error":"test-gemini-secret-do-not-leak"}'),
        )
        mock_open.side_effect = err
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(self.url, {'message': 'Hello'}, format='json')
        self.assertEqual(response.status_code, 502)
        dumped = str(response.json())
        self.assertNotIn('test-gemini-secret-do-not-leak', dumped)

    @patch('chatbot.services.urllib.request.urlopen')
    def test_success_parses_severity_and_omits_secret(self, mock_open):
        payload = (
            b'{"candidates":[{"content":{"parts":['
            b'{"text":"[[SEV:low]]\\nThis is general guidance, not a certificate."}'
            b']}}]}'
        )
        mock_response = MagicMock()
        mock_response.read.return_value = payload
        mock_response.__enter__.return_value = mock_response
        mock_response.__exit__.return_value = False
        mock_open.return_value = mock_response

        self.client.force_authenticate(user=self.owner)
        response = self.client.post(self.url, {'message': 'How does ChargeNOC work?'}, format='json')
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body['severity'], 'low')
        self.assertIn('general guidance', body['reply'])
        dumped = str(body)
        self.assertNotIn('test-gemini-secret-do-not-leak', dumped)
        self.assertNotIn('AIza', dumped)
        request_obj = mock_open.call_args[0][0]
        self.assertNotIn('test-gemini-secret-do-not-leak', body['reply'])
        self.assertEqual(request_obj.get_header('X-goog-api-key'), 'test-gemini-secret-do-not-leak')
