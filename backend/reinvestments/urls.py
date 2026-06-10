from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReinvestmentViewSet

router = DefaultRouter()
router.register(r'', ReinvestmentViewSet, basename='reinvestment')

urlpatterns = [
    path('', include(router.urls)),
]
