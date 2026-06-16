from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings

from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ChangePasswordSerializer,
    ProfileUpdateSerializer,
    ReceiptSettingsSerializer,
    ResetPasswordRequestSerializer,
    ResetPasswordConfirmSerializer,
    CustomTokenObtainPairSerializer,
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = (AllowAny,)


def send_verification_email(user):
    """Send verification email with 6-digit code to user"""
    code = user.generate_email_verification_code()
    subject = "Verify your Kapita account"
    
    # Plain text version for email clients that don't support HTML
    plain_message = f"""
Hi {user.first_name or user.username},

Thank you for signing up for Kapita! Your verification code is:

{code}

This code will expire in 10 minutes.

If you didn't create this account, you can ignore this email.

Best regards,
The Kapita Team
    """.strip()
    
    # Beautiful HTML version
    html_message = f"""
<!DOCTYPE html>
<html lang="en" style="margin: 0; padding: 0;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your Kapita account</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }}
        body {{
            background-color: #f5f7fa;
            padding: 40px 20px;
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
        .code-container {{
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 2px dashed #94a3b8;
            border-radius: 16px;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
        }}
        .code-label {{
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }}
        .verification-code {{
            font-size: 48px;
            font-weight: 800;
            letter-spacing: 12px;
            color: #667eea;
            font-family: 'Courier New', Courier, monospace;
        }}
        .warning {{
            font-size: 14px;
            color: #f59e0b;
            text-align: center;
            margin-bottom: 30px;
        }}
        .divider {{
            height: 1px;
            background-color: #e2e8f0;
            margin: 30px 0;
        }}
        .footer {{
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            color: #94a3b8;
            font-size: 14px;
        }}
        .footer p {{
            margin-bottom: 10px;
        }}
        .highlight {{
            color: #667eea;
            font-weight: 600;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="logo">Kapita</div>
            <p style="color: #94a3b8; font-size: 14px;">Smart Business Tracking</p>
        </div>
        <div class="email-body">
            <div class="greeting">Hi {user.first_name or user.username},</div>
            <p class="message">
                Thank you for signing up for Kapita! We're excited to have you on board. To complete your registration, please use the verification code below:
            </p>
            <div class="code-container">
                <div class="code-label">Verification Code</div>
                <div class="verification-code">{code}</div>
            </div>
            <p class="warning">
                This code will expire in 10 minutes.
            </p>
            <div class="divider"></div>
            <p class="message" style="margin-bottom: 0;">
                If you didn't create this account, you can ignore this email. Your account won't be activated.
            </p>
        </div>
        <div class="footer">
            <p>Best regards,</p>
            <p><span class="highlight">The Kapita Team</span></p>
        </div>
    </div>
</body>
</html>
    """.strip()
    
    try:
        from django.core.mail import EmailMultiAlternatives
        msg = EmailMultiAlternatives(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
        )
        msg.attach_alternative(html_message, "text/html")
        msg.send(fail_silently=False)
        return True
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False


def send_password_reset_email(user):
    """Send password reset email with 6-digit code to user"""
    code = user.generate_password_reset_code()
    subject = "Reset your Kapita password"
    
    # Plain text version for email clients that don't support HTML
    plain_message = f"""
Hi {user.first_name or user.username},

You requested to reset your password. Your password reset code is:

{code}

This code will expire in 10 minutes.

If you didn't request this password reset, you can ignore this email. Your password remains unchanged.

Best regards,
The Kapita Team
    """.strip()
    
    # Beautiful HTML version
    html_message = f"""
<!DOCTYPE html>
<html lang="en" style="margin: 0; padding: 0;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your Kapita password</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }}
        body {{
            background-color: #f5f7fa;
            padding: 40px 20px;
            line-height: 1.6;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(245, 158, 11, 0.3);
        }}
        .email-header {{
            background-color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }}
        .logo {{
            font-size: 32px;
            font-weight: 800;
            color: #f59e0b;
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
        .code-container {{
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 2px dashed #f59e0b;
            border-radius: 16px;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
        }}
        .code-label {{
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }}
        .verification-code {{
            font-size: 48px;
            font-weight: 800;
            letter-spacing: 12px;
            color: #f59e0b;
            font-family: 'Courier New', Courier, monospace;
        }}
        .warning {{
            font-size: 14px;
            color: #dc2626;
            text-align: center;
            margin-bottom: 30px;
        }}
        .divider {{
            height: 1px;
            background-color: #e2e8f0;
            margin: 30px 0;
        }}
        .footer {{
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            color: #94a3b8;
            font-size: 14px;
        }}
        .footer p {{
            margin-bottom: 10px;
        }}
        .highlight {{
            color: #f59e0b;
            font-weight: 600;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="logo">Kapita</div>
            <p style="color: #94a3b8; font-size: 14px;">Smart Business Tracking</p>
        </div>
        <div class="email-body">
            <div class="greeting">Hi {user.first_name or user.username},</div>
            <p class="message">
                You requested to reset your password. Don't worry, it happens! Please use the code below to set a new password:
            </p>
            <div class="code-container">
                <div class="code-label">Password Reset Code</div>
                <div class="verification-code">{code}</div>
            </div>
            <p class="warning">
                This code will expire in 10 minutes.
            </p>
            <div class="divider"></div>
            <p class="message" style="margin-bottom: 0;">
                If you didn't request this password reset, you can ignore this email. Your password remains unchanged.
            </p>
        </div>
        <div class="footer">
            <p>Best regards,</p>
            <p><span class="highlight">The Kapita Team</span></p>
        </div>
    </div>
</body>
</html>
    """.strip()
    
    try:
        from django.core.mail import EmailMultiAlternatives
        msg = EmailMultiAlternatives(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
        )
        msg.attach_alternative(html_message, "text/html")
        msg.send(fail_silently=False)
        return True
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return False


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        # Send verification email (don't fail registration if email fails)
        try:
            send_verification_email(user)
        except Exception:
            pass

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"detail": "Account created successfully. Please check your email for the verification code.", "email": serializer.data['email']},
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


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """Verify email using 6-digit code"""
    email = request.data.get('email')
    code = request.data.get('code')
    
    if not email or not code:
        return Response(
            {"detail": "Email and verification code are required"},
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

    send_password_reset_email(user)
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
