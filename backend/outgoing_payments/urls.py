from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OutgoingPaymentViewSet

router = DefaultRouter()
router.register('', OutgoingPaymentViewSet, basename='outgoingpayment')

urlpatterns = [
    path('', include(router.urls)),
]
