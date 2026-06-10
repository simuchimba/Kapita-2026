from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

from billing.utils import access_summary

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""

    access_status = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    is_trial_active = serializers.SerializerMethodField()
    is_subscription_active = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'business_name', 'currency', 'theme',
            'is_staff', 'is_superuser',
            'access_status', 'days_remaining', 'is_expired',
            'is_trial_active', 'is_subscription_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'is_staff', 'is_superuser',
            'access_status', 'days_remaining', 'is_expired',
            'is_trial_active', 'is_subscription_active',
            'created_at', 'updated_at',
        ]

    def _summary(self, obj):
        return access_summary(obj)

    def get_access_status(self, obj):
        return self._summary(obj)['access_status']

    def get_days_remaining(self, obj):
        return self._summary(obj)['days_remaining']

    def get_is_expired(self, obj):
        return self._summary(obj)['is_expired']

    def get_is_trial_active(self, obj):
        return self._summary(obj)['is_trial_active']

    def get_is_subscription_active(self, obj):
        return self._summary(obj)['is_subscription_active']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'phone', 'business_name'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password]
    )


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for profile updates"""

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone',
            'business_name', 'currency', 'theme',
        ]


class ReceiptSettingsSerializer(serializers.ModelSerializer):
    """Business details printed on customer PDF receipts."""

    class Meta:
        model = User
        fields = [
            'business_name',
            'first_name',
            'last_name',
            'phone',
            'email',
            'address',
            'website',
            'tin',
            'vat_number',
            'business_registration_number',
            'receipt_tagline',
            'receipt_thank_you',
            'receipt_return_policy',
            'currency',
        ]
        read_only_fields = ['email']
