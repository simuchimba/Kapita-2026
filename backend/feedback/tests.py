from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from .models import Feedback

User = get_user_model()


class FeedbackTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='trader', email='trader@example.com', password='StrongPass123!',
            phone='0977000000', business_name='Trader Biz',
        )
        self.admin_user = User.objects.create_user(
            username='admin', email='admin@example.com', password='StrongPass123!',
            phone='0977000001', business_name='Kapita', is_staff=True,
        )

    def _login(self, username, password):
        response = self.client.post('/api/auth/login/', {
            'username_or_email': username,
            'password': password,
        })
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')

    def test_user_can_submit_feedback(self):
        self._login('trader', 'StrongPass123!')
        response = self.client.post('/api/feedback/', {
            'category': 'bug',
            'rating': 4,
            'title': 'Scanner glitch',
            'message': 'The barcode scanner double-beeps sometimes.',
            'page': '/app/sales',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Feedback.objects.count(), 1)
        self.assertEqual(Feedback.objects.first().user, self.user)

    def test_user_sees_only_their_own_feedback(self):
        Feedback.objects.create(user=self.user, title='Mine', message='m')
        Feedback.objects.create(user=self.admin_user, title='Not mine', message='m')
        self._login('trader', 'StrongPass123!')
        response = self.client.get('/api/feedback/mine/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'Mine')

    def test_regular_user_cannot_access_admin_feedback_list(self):
        self._login('trader', 'StrongPass123!')
        response = self.client.get('/api/feedback/admin/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_and_update_feedback_status(self):
        fb = Feedback.objects.create(user=self.user, title='Bug', message='m', category='bug')
        self._login('admin', 'StrongPass123!')

        list_response = self.client.get('/api/feedback/admin/')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        results = list_response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['username'], 'trader')

        patch_response = self.client.patch(f'/api/feedback/admin/{fb.id}/', {'status': 'resolved'})
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        fb.refresh_from_db()
        self.assertEqual(fb.status, 'resolved')

    def test_admin_stats(self):
        Feedback.objects.create(user=self.user, title='A', message='m', category='bug', status='new')
        Feedback.objects.create(user=self.user, title='B', message='m', category='feature', status='resolved')
        self._login('admin', 'StrongPass123!')
        response = self.client.get('/api/feedback/admin/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 2)
        self.assertEqual(response.data['by_status']['new'], 1)
        self.assertEqual(response.data['by_status']['resolved'], 1)
