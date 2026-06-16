from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from .views import (
    RegisterView,
    ProfileView,
    ReceiptSettingsView,
    ChangePasswordView,
    get_user_info,
    verify_email,
    resend_verification_email,
    request_password_reset,
    confirm_password_reset,
    CustomTokenObtainPairView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('receipt-settings/', ReceiptSettingsView.as_view(), name='receipt-settings'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('me/', get_user_info, name='user_info'),
    path('verify-email/', verify_email, name='verify_email'),
    path('resend-verification/', resend_verification_email, name='resend_verification'),
    path('password-reset/request/', request_password_reset, name='request_password_reset'),
    path('password-reset/confirm/', confirm_password_reset, name='confirm_password_reset'),
]
