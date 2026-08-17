import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from products.models import Product

User = get_user_model()


def _llm_json(payload):
    return json.dumps(payload)


class VoiceParseTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='trader', email='trader@example.com', password='StrongPass123!',
            phone='0977000000', business_name='Trader Biz',
        )
        self.product = Product.objects.create(
            user=self.user, name='Tomatoes', category='Vegetables', sku='SKU-TOM1',
            buying_price=4, selling_price=6, quantity=50, unit='pcs',
        )
        login = self.client.post('/api/auth/login/', {
            'username_or_email': 'trader',
            'password': 'StrongPass123!',
        })
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')

    def test_missing_transcript_rejected(self):
        response = self.client.post('/api/voice/parse/', {'transcript': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_requires_auth(self):
        self.client.credentials()
        response = self.client.post('/api/voice/parse/', {'transcript': 'I sold five tomatoes for K30 cash'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('voice.services.chat_completion')
    def test_sale_parsed_and_calculated_from_real_product_data(self, mock_llm):
        # AI proposes a price; the backend must ignore any AI-supplied
        # revenue/profit and compute from the actual Product record.
        mock_llm.return_value = _llm_json({
            'transaction_type': 'sale', 'product_name': 'tomatoes', 'quantity': 5,
            'unit_price': None, 'total_amount': None, 'payment_method': 'cash',
            'customer_name': None, 'expense_category': None, 'description': None,
            'confidence': 0.95, 'missing_field': None,
        })
        response = self.client.post('/api/voice/parse/', {'transcript': 'I sold five tomatoes for thirty kwacha cash'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ready')
        proposal = response.data['proposal']
        self.assertEqual(proposal['product_id'], self.product.id)
        self.assertEqual(proposal['quantity'], 5)
        self.assertEqual(proposal['unit_price'], 6.0)   # from Product.selling_price, not the AI
        self.assertEqual(proposal['total_amount'], 30.0)
        self.assertEqual(proposal['cost_of_goods'], 20.0)
        self.assertEqual(proposal['estimated_profit'], 10.0)
        self.assertEqual(proposal['payment_method'], 'cash')

    @patch('voice.services.chat_completion')
    def test_sale_missing_quantity_asks_for_clarification(self, mock_llm):
        mock_llm.return_value = _llm_json({
            'transaction_type': 'sale', 'product_name': 'tomatoes', 'quantity': None,
            'unit_price': None, 'total_amount': None, 'payment_method': None,
            'customer_name': None, 'expense_category': None, 'description': None,
            'confidence': 0.3, 'missing_field': 'quantity',
        })
        response = self.client.post('/api/voice/parse/', {'transcript': 'I sold some tomatoes'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'clarification_needed')

    @patch('voice.services.chat_completion')
    def test_sale_product_not_in_inventory(self, mock_llm):
        mock_llm.return_value = _llm_json({
            'transaction_type': 'sale', 'product_name': 'Mangoes', 'quantity': 3,
            'unit_price': None, 'total_amount': None, 'payment_method': 'cash',
            'customer_name': None, 'expense_category': None, 'description': None,
            'confidence': 0.9, 'missing_field': None,
        })
        response = self.client.post('/api/voice/parse/', {'transcript': 'I sold three mangoes for cash'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'product_not_found')
        self.assertEqual(response.data['product_name'], 'Mangoes')

    @patch('voice.services.chat_completion')
    def test_sale_ambiguous_product_offers_candidates(self, mock_llm):
        Product.objects.create(
            user=self.user, name='Tomatoes Large', category='Vegetables', sku='SKU-TOM2',
            buying_price=5, selling_price=8, quantity=20, unit='pcs',
        )
        mock_llm.return_value = _llm_json({
            'transaction_type': 'sale', 'product_name': 'Tom', 'quantity': 2,
            'unit_price': None, 'total_amount': None, 'payment_method': 'cash',
            'customer_name': None, 'expense_category': None, 'description': None,
            'confidence': 0.8, 'missing_field': None,
        })
        response = self.client.post('/api/voice/parse/', {'transcript': 'I sold two toms'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ambiguous_product')
        self.assertEqual(len(response.data['candidates']), 2)

    @patch('voice.services.chat_completion')
    def test_sale_insufficient_stock(self, mock_llm):
        mock_llm.return_value = _llm_json({
            'transaction_type': 'sale', 'product_name': 'tomatoes', 'quantity': 500,
            'unit_price': None, 'total_amount': None, 'payment_method': 'cash',
            'customer_name': None, 'expense_category': None, 'description': None,
            'confidence': 0.9, 'missing_field': None,
        })
        response = self.client.post('/api/voice/parse/', {'transcript': 'I sold five hundred tomatoes'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'insufficient_stock')

    @patch('voice.services.chat_completion')
    def test_expense_parsed(self, mock_llm):
        mock_llm.return_value = _llm_json({
            'transaction_type': 'expense', 'product_name': None, 'quantity': None,
            'unit_price': None, 'total_amount': 50, 'payment_method': None,
            'customer_name': None, 'expense_category': 'transport', 'description': 'Transport to market',
            'confidence': 0.92, 'missing_field': None,
        })
        response = self.client.post('/api/voice/parse/', {'transcript': 'I spent K50 on transport'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ready')
        self.assertEqual(response.data['transaction_type'], 'expense')
        self.assertEqual(response.data['proposal']['amount'], 50)
        self.assertEqual(response.data['proposal']['category'], 'transport')

    @patch('voice.services.chat_completion')
    def test_expense_missing_amount_asks_for_clarification(self, mock_llm):
        mock_llm.return_value = _llm_json({
            'transaction_type': 'expense', 'product_name': None, 'quantity': None,
            'unit_price': None, 'total_amount': None, 'payment_method': None,
            'customer_name': None, 'expense_category': 'transport', 'description': 'transport',
            'confidence': 0.3, 'missing_field': 'amount',
        })
        response = self.client.post('/api/voice/parse/', {'transcript': 'I spent some money on transport'})
        self.assertEqual(response.data['status'], 'clarification_needed')

    @patch('voice.services.chat_completion')
    def test_unclear_speech_asks_to_retry(self, mock_llm):
        mock_llm.return_value = _llm_json({
            'transaction_type': 'unclear', 'product_name': None, 'quantity': None,
            'unit_price': None, 'total_amount': None, 'payment_method': None,
            'customer_name': None, 'expense_category': None, 'description': None,
            'confidence': 0.1, 'missing_field': None,
        })
        response = self.client.post('/api/voice/parse/', {'transcript': 'umm what was I saying'})
        self.assertEqual(response.data['status'], 'clarification_needed')

    @patch('voice.services.chat_completion')
    def test_malformed_llm_json_handled_gracefully(self, mock_llm):
        mock_llm.return_value = 'this is not json at all'
        response = self.client.post('/api/voice/parse/', {'transcript': 'I sold five tomatoes'})
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn('detail', response.data)

    def test_resolve_ambiguous_product_pick_without_transcript(self):
        response = self.client.post('/api/voice/parse/', {
            'product_id': self.product.id, 'quantity': 3, 'payment_method': 'cash',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ready')
        self.assertEqual(response.data['proposal']['product_id'], self.product.id)
        self.assertEqual(response.data['proposal']['total_amount'], 18.0)

    @patch('voice.services.chat_completion')
    def test_ai_supplied_price_is_honored_when_stated(self, mock_llm):
        # If the user explicitly states a price, honor it (still backend-computed totals).
        mock_llm.return_value = _llm_json({
            'transaction_type': 'sale', 'product_name': 'tomatoes', 'quantity': 4,
            'unit_price': 7, 'total_amount': None, 'payment_method': 'cash',
            'customer_name': None, 'expense_category': None, 'description': None,
            'confidence': 0.9, 'missing_field': None,
        })
        response = self.client.post('/api/voice/parse/', {'transcript': 'I sold 4 tomatoes at K7 each'})
        proposal = response.data['proposal']
        self.assertEqual(proposal['unit_price'], 7.0)
        self.assertEqual(proposal['total_amount'], 28.0)
        self.assertEqual(proposal['cost_of_goods'], 16.0)
        self.assertEqual(proposal['estimated_profit'], 12.0)
