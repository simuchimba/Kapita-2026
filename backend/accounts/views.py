from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ChangePasswordSerializer,
    ProfileUpdateSerializer,
    ReceiptSettingsSerializer,
    CustomTokenObtainPairSerializer,
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = (AllowAny,)


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"detail": "Account created successfully.", "email": serializer.data['email']},
            status=status.HTTP_201_CREATED
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get and update user profile"""
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProfileUpdateSerializer
        return UserSerializer


class ReceiptSettingsView(generics.RetrieveUpdateAPIView):
    """Get and update details shown on customer PDF receipts."""
    serializer_class = ReceiptSettingsSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """Change user password"""
    serializer_class = ChangePasswordSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            # Check old password
            if not user.check_password(serializer.data.get("old_password")):
                return Response(
                    {"old_password": ["Wrong password."]},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Set new password
            user.set_password(serializer.data.get("new_password"))
            user.save()

            return Response(
                {"message": "Password updated successfully"},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    """Get current user information"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)



<<<<<<< HEAD
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"detail": "User with this email not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if user.email_verified:
        return Response(
            {"detail": "Email is already verified"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not user.is_email_verification_code_valid(code):
        return Response(
            {"detail": "Invalid or expired verification code"},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.email_verified = True
    user.email_verification_code = None
    user.email_verification_code_expires_at = None
    user.save()

    return Response(
        {"detail": "Email verified successfully"},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_email(request):
    """Resend verification email with new code"""
    email = request.data.get('email')
    if not email:
        return Response(
            {"detail": "Email is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"detail": "User with this email not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if user.email_verified:
        return Response(
            {"detail": "Email is already verified"},
            status=status.HTTP_400_BAD_REQUEST
        )

    send_verification_email(user)
    return Response(
        {"detail": "Verification email sent with a new code"},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """Request password reset email"""
    serializer = ResetPasswordRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    email = serializer.validated_data['email']
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal if email exists or not for security
        return Response(
            {"detail": "If an account exists with this email, a password reset link has been sent"},
            status=status.HTTP_200_OK
        )

    try:
        send_password_reset_email(user)
    except Exception:
        pass
    return Response(
        {"detail": "If an account exists with this email, a password reset link has been sent"},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    """Confirm password reset with code and set new password"""
    serializer = ResetPasswordConfirmSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    email = serializer.validated_data['email']
    code = serializer.validated_data['code']
    new_password = serializer.validated_data['new_password']

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"detail": "Invalid or expired reset code"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not user.is_password_reset_code_valid(code):
        return Response(
            {"detail": "Invalid or expired reset code"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Set new password
    user.set_password(new_password)
    user.password_reset_code = None
    user.password_reset_code_expires_at = None
    user.save()

    return Response(
        {"detail": "Password has been reset successfully. You can now log in with your new password"},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_test_email(request):
    """Send a test email to the authenticated user's email address"""
    try:
        user = request.user
        subject = "Kapita Test Email"
        plain_message = f"""Hello {user.first_name or user.username}!

This is a test email from your Kapita installation. If you're receiving this, your email configuration is working correctly!

Best regards,
The Kapita Team
""".strip()
        
        html_message = f"""
<!DOCTYPE html>
<html lang="en" style="margin: 0; padding: 0;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kapita Test Email</title>
    <style>
        body {{
            background-color: #f5f7fa;
            padding: 40px 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
        }}
        .email-header {{
            background-color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }}
        .logo {{
            font-size: 32px;
            font-weight: 800;
            color: #667eea;
            margin-bottom: 10px;
        }}
        .email-body {{
            background-color: #ffffff;
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 20px;
        }}
        .message {{
            font-size: 16px;
            color: #64748b;
            margin-bottom: 30px;
        }}
        .success-box {{
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border: 2px solid #10b981;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }}
        .success-text {{
            color: #065f46;
            font-weight: 600;
            font-size: 18px;
        }}
        .footer {{
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            color: #94a3b8;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="logo">Kapita</div>
            <p style="color: #94a3b8; font-size: 14px;">Test Email Configuration</p>
        </div>
        <div class="email-body">
            <div class="greeting">Hello {user.first_name or user.username}!</div>
            <p class="message">This is a test email from your Kapita installation. If you're reading this, your email configuration is working perfectly!</p>
            
            <div class="success-box">
                <div class="success-text">✅ Email Setup Successful!</div>
            </div>
        </div>
        <div class="footer">
            <p>Best regards,</p>
            <p><span style="color: #667eea; font-weight: 600;">The Kapita Team</span></p>
        </div>
    </div>
</body>
</html>
        """.strip()

        from django.core.mail import EmailMultiAlternatives
        msg = EmailMultiAlternatives(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
        )
        msg.attach_alternative(html_message, "text/html")
        msg.send(fail_silently=False)

        return Response(
            {"detail": f"Test email sent successfully to {user.email}!"},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        print(f"Error sending test email: {e}")
        return Response(
            {"detail": f"Failed to send test email: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
=======
>>>>>>> 50883fc (removed email verification and forgot password for testing)
