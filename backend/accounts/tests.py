from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class LoginTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='trader',
            email='trader@example.com',
            password='StrongPass123!',
            phone='0977000000',
            business_name='Trader Biz',
        )

    def test_login_with_username(self):
        response = self.client.post('/api/auth/login/', {
            'username_or_email': 'trader',
            'password': 'StrongPass123!',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_with_email(self):
        response = self.client.post('/api/auth/login/', {
            'username_or_email': 'trader@example.com',
            'password': 'StrongPass123!',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_wrong_password_returns_readable_error(self):
        response = self.client.post('/api/auth/login/', {
            'username_or_email': 'trader',
            'password': 'wrong-password',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # CustomTokenObtainPairSerializer raises a plain ValidationError, which
        # DRF serializes under non_field_errors — the frontend must be able to
        # read this key or login failures show a useless generic message.
        self.assertIn('non_field_errors', response.data)

    def test_login_unknown_user(self):
        response = self.client.post('/api/auth/login/', {
            'username_or_email': 'nobody@example.com',
            'password': 'whatever',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TokenRefreshRotationTests(APITestCase):
    """Guards the exact bug that was locking admins out mid-session:
    SIMPLE_JWT rotates + blacklists refresh tokens, so a client that discards
    the new refresh token returned by /auth/token/refresh/ will fail on the
    very next refresh."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='trader',
            email='trader@example.com',
            password='StrongPass123!',
            phone='0977000000',
            business_name='Trader Biz',
        )
        login = self.client.post('/api/auth/login/', {
            'username_or_email': 'trader',
            'password': 'StrongPass123!',
        })
        self.original_refresh = login.data['refresh']

    def test_refresh_rotates_and_returns_new_refresh_token(self):
        response = self.client.post('/api/auth/token/refresh/', {'refresh': self.original_refresh})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertNotEqual(response.data['refresh'], self.original_refresh)

    def test_reusing_original_refresh_token_after_rotation_fails(self):
        first = self.client.post('/api/auth/token/refresh/', {'refresh': self.original_refresh})
        self.assertEqual(first.status_code, status.HTTP_200_OK)

        reused = self.client.post('/api/auth/token/refresh/', {'refresh': self.original_refresh})
        self.assertEqual(reused.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_new_refresh_token_from_rotation_still_works(self):
        first = self.client.post('/api/auth/token/refresh/', {'refresh': self.original_refresh})
        new_refresh = first.data['refresh']

        second = self.client.post('/api/auth/token/refresh/', {'refresh': new_refresh})
        self.assertEqual(second.status_code, status.HTTP_200_OK)


class ProfileAuthTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='trader',
            email='trader@example.com',
            password='StrongPass123!',
            phone='0977000000',
            business_name='Trader Biz',
        )

    def test_profile_requires_auth(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_with_valid_token(self):
        login = self.client.post('/api/auth/login/', {
            'username_or_email': 'trader',
            'password': 'StrongPass123!',
        })
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'trader@example.com')
