from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    RegisterView,
    ProfileView,
    ReceiptSettingsView,
    ChangePasswordView,
    get_user_info
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('receipt-settings/', ReceiptSettingsView.as_view(), name='receipt-settings'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('me/', get_user_info, name='user_info'),
]
