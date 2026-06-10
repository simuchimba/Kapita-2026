from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import PaymentSubmission, Subscription, ActivityLog
from .utils import access_summary, trial_end_date, latest_active_subscription, latest_payment
from .media_urls import build_payment_proof_url

User = get_user_model()


class PaymentSubmissionSerializer(serializers.ModelSerializer):
    proof_image_url = serializers.SerializerMethodField()
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_business_name = serializers.CharField(source='user.business_name', read_only=True)

    class Meta:
        model = PaymentSubmission
        fields = [
            'id', 'user', 'user_username', 'user_email', 'user_business_name', 'proof_image', 'proof_image_url', 'transaction_id', 'amount',
            'notes', 'status', 'admin_notes', 'reviewed_by', 'reviewed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'user_username', 'user_email', 'user_business_name', 'status', 'admin_notes', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at', 'proof_image_url']

    def get_proof_image_url(self, obj):
        if not obj.proof_image:
            return None
        request = self.context.get('request')
        return build_payment_proof_url(request, obj.id)


class PaymentSubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentSubmission
        fields = ['proof_image', 'transaction_id', 'amount', 'notes']


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ['id', 'user', 'start_date', 'end_date', 'source_payment', 'status', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.username', read_only=True)
    target_username = serializers.CharField(source='target_user.username', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'actor_username', 'target_username', 'action', 'details', 'created_at']


class BillingStatusSerializer(serializers.ModelSerializer):
    access_status = serializers.SerializerMethodField()
    trial_end_date = serializers.SerializerMethodField()
    subscription_end_date = serializers.SerializerMethodField()
    expiry_date = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    is_trial_active = serializers.SerializerMethodField()
    is_subscription_active = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    is_pending_payment = serializers.SerializerMethodField()
    last_payment_date = serializers.SerializerMethodField()
    latest_payment_submission = serializers.SerializerMethodField()
    subscriptions = SubscriptionSerializer(many=True, read_only=True)
    recent_payments = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone', 'business_name',
            'currency', 'theme', 'is_staff', 'is_superuser', 'date_joined',
            'access_status', 'trial_end_date', 'subscription_end_date', 'expiry_date',
            'days_remaining', 'is_trial_active', 'is_subscription_active', 'is_expired',
            'is_pending_payment', 'last_payment_date', 'latest_payment_submission', 'subscriptions', 'recent_payments'
        ]

    def get_access_status(self, obj):
        return access_summary(obj)['access_status']

    def get_trial_end_date(self, obj):
        return trial_end_date(obj)

    def get_subscription_end_date(self, obj):
        subscription = latest_active_subscription(obj)
        return subscription.end_date if subscription else None

    def get_expiry_date(self, obj):
        return access_summary(obj)['expiry_date']

    def get_days_remaining(self, obj):
        return access_summary(obj)['days_remaining']

    def get_is_trial_active(self, obj):
        return access_summary(obj)['is_trial_active']

    def get_is_subscription_active(self, obj):
        return access_summary(obj)['is_subscription_active']

    def get_is_expired(self, obj):
        return access_summary(obj)['is_expired']

    def get_is_pending_payment(self, obj):
        return access_summary(obj)['is_pending_payment']

    def get_last_payment_date(self, obj):
        last_payment = latest_payment(obj)
        return last_payment.reviewed_at if last_payment and last_payment.reviewed_at else None

    def get_latest_payment_submission(self, obj):
        payment = obj.payment_submissions.order_by('-created_at').first()
        if not payment:
            return None
        return PaymentSubmissionSerializer(payment, context=self.context).data

    def get_recent_payments(self, obj):
        queryset = obj.payment_submissions.order_by('-created_at')[:10]
        return PaymentSubmissionSerializer(queryset, many=True, context=self.context).data


class AdminUserSerializer(serializers.ModelSerializer):
    access_status = serializers.SerializerMethodField()
    trial_end_date = serializers.SerializerMethodField()
    subscription_end_date = serializers.SerializerMethodField()
    expiry_date = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    last_payment_date = serializers.SerializerMethodField()
    pending_payment_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone', 'business_name',
            'date_joined', 'is_active', 'is_staff', 'is_superuser', 'access_status',
            'trial_end_date', 'subscription_end_date', 'expiry_date', 'days_remaining',
            'last_payment_date', 'pending_payment_status'
        ]

    def get_access_status(self, obj):
        return access_summary(obj)['access_status']

    def get_trial_end_date(self, obj):
        return trial_end_date(obj)

    def get_subscription_end_date(self, obj):
        subscription = latest_active_subscription(obj)
        return subscription.end_date if subscription else None

    def get_expiry_date(self, obj):
        return access_summary(obj)['expiry_date']

    def get_days_remaining(self, obj):
        return access_summary(obj)['days_remaining']

    def get_last_payment_date(self, obj):
        last_payment = latest_payment(obj)
        return last_payment.reviewed_at if last_payment and last_payment.reviewed_at else None

    def get_pending_payment_status(self, obj):
        return access_summary(obj)['is_pending_payment']


class ApproveRejectSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)


class ExtendSubscriptionSerializer(serializers.Serializer):
    days = serializers.IntegerField(min_value=1, default=30)
    notes = serializers.CharField(required=False, allow_blank=True)


class SubmitPaymentProofSerializer(serializers.Serializer):
    proof_image = serializers.ImageField()
    transaction_id = serializers.CharField(max_length=120)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    notes = serializers.CharField(required=False, allow_blank=True)
