from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from suppliers.models import Supplier
from purchase_orders.models import PurchaseOrder

User = get_user_model()


class AdminGatingTests(APITestCase):
    """The admin panel is only useful if non-admins are actually kept out and
    admins actually get in — this is the exact split that was silently
    breaking ('admin panel not able to load users')."""

    def setUp(self):
        self.regular_user = User.objects.create_user(
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

    def test_regular_user_cannot_access_admin_users_list(self):
        self._login('trader', 'StrongPass123!')
        response = self.client.get('/api/billing/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_access_admin_users_list(self):
        response = self.client.get('/api/billing/admin/users/')
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_admin_can_list_users(self):
        self._login('admin', 'StrongPass123!')
        response = self.client.get('/api/billing/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [u['email'] for u in response.data]
        self.assertIn('trader@example.com', emails)
        self.assertIn('admin@example.com', emails)

    def test_admin_users_search_filters_by_business_name(self):
        self._login('admin', 'StrongPass123!')
        response = self.client.get('/api/billing/admin/users/', {'search': 'Trader Biz'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [u['email'] for u in response.data]
        self.assertEqual(emails, ['trader@example.com'])


class AdminCrossTenantListTests(APITestCase):
    """Purchase Orders / Suppliers admin views must show data across every
    tenant, not just the logged-in admin's own (empty) records."""

    def setUp(self):
        self.owner_a = User.objects.create_user(
            username='owner_a', email='owner_a@example.com', password='StrongPass123!',
            phone='0977000002', business_name='Shop A',
        )
        self.owner_b = User.objects.create_user(
            username='owner_b', email='owner_b@example.com', password='StrongPass123!',
            phone='0977000003', business_name='Shop B',
        )
        self.admin_user = User.objects.create_user(
            username='admin', email='admin@example.com', password='StrongPass123!',
            phone='0977000001', business_name='Kapita', is_staff=True,
        )

        self.supplier_a = Supplier.objects.create(user=self.owner_a, name='Acme Supplies')
        self.supplier_b = Supplier.objects.create(user=self.owner_b, name='Beta Traders')

        PurchaseOrder.objects.create(user=self.owner_a, supplier=self.supplier_a, status='pending', total_amount=100)
        PurchaseOrder.objects.create(user=self.owner_b, supplier=self.supplier_b, status='received', total_amount=250)

        login = self.client.post('/api/auth/login/', {
            'username_or_email': 'admin',
            'password': 'StrongPass123!',
        })
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')

    def test_admin_sees_suppliers_from_every_tenant(self):
        response = self.client.get('/api/billing/admin/suppliers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = {s['name'] for s in response.data}
        self.assertEqual(names, {'Acme Supplies', 'Beta Traders'})

    def test_admin_sees_purchase_orders_from_every_tenant(self):
        response = self.client.get('/api/billing/admin/purchase-orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        owners = {po['user']['username'] for po in response.data}
        self.assertEqual(owners, {'owner_a', 'owner_b'})

    def test_admin_purchase_orders_status_filter(self):
        response = self.client.get('/api/billing/admin/purchase-orders/', {'status': 'received'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'received')

    def test_non_admin_cannot_list_admin_suppliers(self):
        self.client.credentials()
        login = self.client.post('/api/auth/login/', {
            'username_or_email': 'owner_a',
            'password': 'StrongPass123!',
        })
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')
        response = self.client.get('/api/billing/admin/suppliers/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
