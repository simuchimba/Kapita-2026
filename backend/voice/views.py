from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from products.models import Product
from .services import TransactionParser, ProductMatchingService, FinancialCalculationService, TransactionParseError

CLARIFICATION_MESSAGES = {
    'quantity': "I heard a sale, but couldn't tell how many were sold. How many?",
    'amount': "I couldn't catch the amount. How much was it?",
    'product_name': "I couldn't tell what product you meant. Which product?",
}


class VoiceParseView(APIView):
    """POST /api/voice/parse/ — {transcript} -> a structured, ready-to-confirm
    transaction proposal, a clarification request, or a product disambiguation
    prompt. Never writes anything — saving only happens when the client
    confirms and POSTs to the existing /api/sales/ or /api/expenses/ endpoints.

    Also accepts {product_id, quantity, unit_price?, payment_method?, customer_name?}
    without a transcript, to resolve a disambiguation pick (Feature 6) without
    re-running the AI parse."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        if product_id:
            return self._resolve_product_pick(request)

        transcript = (request.data.get('transcript') or '').strip()
        if not transcript:
            return Response({'detail': 'transcript is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            parsed = TransactionParser().parse(transcript)
        except TransactionParseError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        transaction_type = parsed['transaction_type']

        if transaction_type == 'unclear' or parsed['confidence'] < 0.4:
            return Response({
                'status': 'clarification_needed',
                'message': "I didn't quite understand that. Could you try again, or enter it manually?",
                'transcript': transcript,
            })

        if transaction_type == 'sale':
            return self._handle_sale(request, transcript, parsed)

        return self._handle_expense(transcript, parsed)

    def _handle_sale(self, request, transcript, parsed):
        if not parsed['product_name']:
            return self._clarify(transcript, 'product_name')
        if not parsed['quantity']:
            return self._clarify(transcript, 'quantity')

        match = ProductMatchingService().match(request.user, parsed['product_name'])

        if match['status'] == 'not_found':
            return Response({
                'status': 'product_not_found',
                'product_name': parsed['product_name'],
                'transcript': transcript,
            })

        if match['status'] == 'ambiguous':
            return Response({
                'status': 'ambiguous_product',
                'product_name': parsed['product_name'],
                'transcript': transcript,
                'candidates': [
                    {'id': p.id, 'name': p.name, 'selling_price': float(p.selling_price), 'unit': p.unit, 'quantity_available': p.quantity}
                    for p in match['matches']
                ],
                'quantity': parsed['quantity'],
                'payment_method': parsed['payment_method'],
                'customer_name': parsed['customer_name'],
            })

        return self._build_sale_proposal(
            transcript, match['product'], parsed['quantity'], parsed['unit_price'],
            parsed['payment_method'], parsed['customer_name'], parsed['confidence'],
        )

    def _resolve_product_pick(self, request):
        product = Product.objects.filter(user=request.user, id=request.data.get('product_id')).first()
        if not product:
            return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            quantity = float(request.data.get('quantity'))
        except (TypeError, ValueError):
            return Response({'detail': 'quantity is required'}, status=status.HTTP_400_BAD_REQUEST)

        unit_price = request.data.get('unit_price')
        unit_price = float(unit_price) if unit_price not in (None, '') else None

        return self._build_sale_proposal(
            request.data.get('transcript', ''), product, quantity, unit_price,
            request.data.get('payment_method'), request.data.get('customer_name'), 1.0,
        )

    def _build_sale_proposal(self, transcript, product, quantity, unit_price, payment_method, customer_name, confidence):
        if product.quantity < quantity:
            return Response({
                'status': 'insufficient_stock',
                'message': f"You only have {product.quantity} {product.unit} of {product.name} in stock.",
                'transcript': transcript,
            })

        calc = FinancialCalculationService().calculate_sale(product, quantity, unit_price)

        return Response({
            'status': 'ready',
            'transaction_type': 'sale',
            'transcript': transcript,
            'confidence': confidence,
            'proposal': {
                'product_id': product.id,
                'product_name': product.name,
                'unit': product.unit,
                'quantity': quantity,
                'unit_price': calc['unit_price'],
                'total_amount': calc['total_amount'],
                'cost_of_goods': calc['cost_of_goods'],
                'estimated_profit': calc['estimated_profit'],
                'payment_method': payment_method or 'cash',
                'customer_name': customer_name,
            },
        })

    def _handle_expense(self, transcript, parsed):
        if not parsed['total_amount']:
            return self._clarify(transcript, 'amount')

        return Response({
            'status': 'ready',
            'transaction_type': 'expense',
            'transcript': transcript,
            'confidence': parsed['confidence'],
            'proposal': {
                'title': parsed['description'] or parsed['expense_category'].replace('_', ' ').title(),
                'amount': parsed['total_amount'],
                'category': parsed['expense_category'],
            },
        })

    def _clarify(self, transcript, field):
        return Response({
            'status': 'clarification_needed',
            'message': CLARIFICATION_MESSAGES.get(field, 'Could you give me a bit more detail?'),
            'missing_field': field,
            'transcript': transcript,
        })
