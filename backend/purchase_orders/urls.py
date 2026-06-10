from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PurchaseOrderViewSet

router = DefaultRouter()
router.register('', PurchaseOrderViewSet, basename='purchaseorder')

urlpatterns = [
    path('', include(router.urls)),
]
