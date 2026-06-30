from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Currency, ExchangeRate
from .serializers import CurrencySerializer, ExchangeRateSerializer


class CurrencyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'code'


class ExchangeRateViewSet(viewsets.ModelViewSet):
    serializer_class = ExchangeRateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ExchangeRate.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def convert(self, request):
        amount = request.query_params.get('amount', 1)
        from_currency = request.query_params.get('from')
        to_currency = request.query_params.get('to')

        if not from_currency or not to_currency:
            return Response({'error': 'from and to currency codes required'}, status=400)

        if from_currency == to_currency:
            return Response({'amount': float(amount), 'from': from_currency, 'to': to_currency, 'rate': 1.0})

        rate = ExchangeRate.objects.filter(
            user=request.user,
            base_currency=from_currency,
            target_currency=to_currency
        ).first()

        if not rate:
            inverse = ExchangeRate.objects.filter(
                user=request.user,
                base_currency=to_currency,
                target_currency=from_currency
            ).first()
            if inverse:
                rate_value = float(1 / inverse.rate)
            else:
                return Response({'error': 'Exchange rate not configured'}, status=404)
        else:
            rate_value = float(rate.rate)

        converted = float(amount) * rate_value
        return Response({
            'amount': round(converted, 2),
            'from': from_currency,
            'to': to_currency,
            'rate': rate_value
        })
