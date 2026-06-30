from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CurrencyViewSet, ExchangeRateViewSet

router = DefaultRouter()
router.register(r'rates', ExchangeRateViewSet, basename='exchange-rate')

urlpatterns = [
    path('', CurrencyViewSet.as_view({'get': 'list'}), name='currency-list'),
    path('<str:code>/', CurrencyViewSet.as_view({'get': 'retrieve'}), name='currency-detail'),
    path('rates/convert/', ExchangeRateViewSet.as_view({'get': 'convert'}), name='currency-convert'),
    path('rates/', include(router.urls)),
]
