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
)

User = get_user_model()


def send_verification_email(user):
    """Send verification email with 6-digit code to user"""
    code = user.generate_email_verification_code()
    subject = "Verify your Kapita account"
    message = f"""
Hi {user.first_name or user.username},

Thank you for signing up for Kapita! Your verification code is:

{code}

This code will expire in 10 minutes.

If you didn't create this account, you can ignore this email.

Best regards,
The Kapita Team
    """.strip()
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        # Send verification email
        send_verification_email(user)

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
