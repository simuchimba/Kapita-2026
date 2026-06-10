from datetime import timedelta
import csv

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from django.http import FileResponse

from accounts.serializers import UserSerializer
from .models import PaymentSubmission, Subscription, ActivityLog
from .serializers import (
    PaymentSubmissionSerializer,
    PaymentSubmissionCreateSerializer,
    BillingStatusSerializer,
    AdminUserSerializer,
    ApproveRejectSerializer,
    ExtendSubscriptionSerializer,
    ActivityLogSerializer,
)
from .utils import access_summary, trial_end_date, latest_active_subscription, access_status, SUBSCRIPTION_DAYS
from .notifications import simulate_email_notification
from .analytics import build_admin_chart_payload

User = get_user_model()


class MyBillingStatusView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BillingStatusSerializer

    def get_object(self):
        return self.request.user


class SubmitPaymentProofView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if PaymentSubmission.objects.filter(user=request.user, status=PaymentSubmission.STATUS_PENDING).exists():
            return Response(
                {'detail': 'You already have a pending payment submission. Please wait for admin review.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = PaymentSubmissionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = PaymentSubmission.objects.create(user=request.user, **serializer.validated_data)
        ActivityLog.objects.create(
            actor=request.user,
            target_user=request.user,
            payment_submission=payment,
            action='payment_proof_submitted',
            details={'transaction_id': payment.transaction_id, 'amount': str(payment.amount)},
        )
        return Response(PaymentSubmissionSerializer(payment, context={'request': request}).data, status=status.HTTP_201_CREATED)


class PaymentHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentSubmissionSerializer
    pagination_class = None

    def get_queryset(self):
        return PaymentSubmission.objects.filter(user=self.request.user)


class AdminOverviewView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.all()
        trial = 0
        subscription = 0
        expired = 0
        pending = 0

        for user in users:
            status_value = access_status(user)
            if status_value == 'active_trial':
                trial += 1
            elif status_value == 'active_subscription':
                subscription += 1
            elif status_value == 'pending_payment_verification':
                pending += 1
            else:
                expired += 1

        recent_logs = ActivityLogSerializer(
            ActivityLog.objects.select_related('actor', 'target_user', 'payment_submission')[:10],
            many=True,
        ).data
        charts = build_admin_chart_payload()
        return Response({
            'total_users': users.count(),
            'active_trials': trial,
            'active_subscriptions': subscription,
            'expired_users': expired,
            'pending_payment_verifications': pending,
            'recent_activity': recent_logs,
            **charts,
        })


class AdminUsersView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        search = request.query_params.get('search', '').strip()
        status_filter = request.query_params.get('status', '').strip()
        export = request.query_params.get('export', '').strip()

        queryset = User.objects.all().order_by('-date_joined')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(business_name__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        serialized = AdminUserSerializer(queryset, many=True).data
        if status_filter:
            serialized = [item for item in serialized if item['access_status'] == status_filter]

        if export == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="users_export.csv"'
            writer = csv.writer(response)
            writer.writerow(['Name', 'Email', 'Signup Date', 'Trial End Date', 'Subscription Status', 'Days Remaining', 'Last Payment Date', 'Expiry Date'])
            for item in serialized:
                writer.writerow([
                    f"{item.get('first_name', '')} {item.get('last_name', '')}".strip() or item.get('username'),
                    item.get('email'),
                    item.get('date_joined'),
                    item.get('trial_end_date'),
                    item.get('access_status'),
                    item.get('days_remaining'),
                    item.get('last_payment_date'),
                    item.get('expiry_date'),
                ])
            return response

        return Response(serialized)


class AdminPaymentsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        status_filter = request.query_params.get('status', 'pending')
        queryset = PaymentSubmission.objects.select_related('user', 'reviewed_by').order_by('-created_at')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return Response(PaymentSubmissionSerializer(queryset, many=True, context={'request': request}).data)


class ApprovePaymentView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, payment_id):
        payment = get_object_or_404(PaymentSubmission.objects.select_related('user'), id=payment_id)
        serializer = ApproveRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        notes = serializer.validated_data.get('notes', '')

        today = timezone.localdate()
        payment.status = PaymentSubmission.STATUS_APPROVED
        payment.admin_notes = notes
        payment.reviewed_by = request.user
        payment.reviewed_at = timezone.now()
        payment.save(update_fields=['status', 'admin_notes', 'reviewed_by', 'reviewed_at', 'updated_at'])

        subscription = Subscription.objects.create(
            user=payment.user,
            start_date=today,
            end_date=today + timedelta(days=SUBSCRIPTION_DAYS),
            source_payment=payment,
            status=Subscription.STATUS_ACTIVE,
            notes=notes,
        )
        ActivityLog.objects.create(
            actor=request.user,
            target_user=payment.user,
            payment_submission=payment,
            action='payment_approved',
            details={'subscription_id': subscription.id, 'end_date': str(subscription.end_date)},
        )
        simulate_email_notification(
            user=payment.user,
            subject='Kapita payment approved',
            message=f'Your payment was approved. Subscription active until {subscription.end_date}.',
        )
        return Response({'message': 'Payment approved and subscription activated', 'subscription_id': subscription.id})


class RejectPaymentView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, payment_id):
        payment = get_object_or_404(PaymentSubmission.objects.select_related('user'), id=payment_id)
        serializer = ApproveRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        notes = serializer.validated_data.get('notes', '')

        payment.status = PaymentSubmission.STATUS_REJECTED
        payment.admin_notes = notes
        payment.reviewed_by = request.user
        payment.reviewed_at = timezone.now()
        payment.save(update_fields=['status', 'admin_notes', 'reviewed_by', 'reviewed_at', 'updated_at'])
        ActivityLog.objects.create(
            actor=request.user,
            target_user=payment.user,
            payment_submission=payment,
            action='payment_rejected',
            details={'notes': notes},
        )
        simulate_email_notification(
            user=payment.user,
            subject='Kapita payment rejected',
            message=notes or 'Your payment proof was rejected. Please submit a new proof.',
        )
        return Response({'message': 'Payment rejected'})


class UserSubscriptionHistoryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, user_id):
        subscriptions = Subscription.objects.filter(user_id=user_id).order_by('-created_at')
        return Response([{
            'id': item.id,
            'start_date': item.start_date,
            'end_date': item.end_date,
            'status': item.status,
            'source_payment_id': item.source_payment_id,
            'notes': item.notes,
            'created_at': item.created_at,
        } for item in subscriptions])


class ExtendSubscriptionView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        serializer = ExtendSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        days = serializer.validated_data['days']
        notes = serializer.validated_data.get('notes', '')

        user = get_object_or_404(User, id=user_id)
        subscription = latest_active_subscription(user)
        if subscription:
            subscription.end_date = subscription.end_date + timedelta(days=days)
            subscription.notes = notes or subscription.notes
            subscription.save(update_fields=['end_date', 'notes', 'updated_at'])
        else:
            today = timezone.localdate()
            subscription = Subscription.objects.create(
                user=user,
                start_date=today,
                end_date=today + timedelta(days=days),
                status=Subscription.STATUS_ACTIVE,
                notes=notes,
            )

        ActivityLog.objects.create(
            actor=request.user,
            target_user=user,
            action='subscription_extended',
            details={'days': days, 'notes': notes, 'subscription_id': subscription.id},
        )
        simulate_email_notification(
            user=user,
            subject='Kapita subscription extended',
            message=f'Your subscription was extended by {days} day(s). New end date: {subscription.end_date}.',
        )
        return Response({'message': 'Subscription extended', 'subscription_id': subscription.id, 'end_date': subscription.end_date})


class RevokeSubscriptionView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        subscription = latest_active_subscription(user)
        if subscription:
            subscription.status = Subscription.STATUS_REVOKED
            subscription.save(update_fields=['status', 'updated_at'])
            ActivityLog.objects.create(
                actor=request.user,
                target_user=user,
                action='subscription_revoked',
                details={'subscription_id': subscription.id},
            )
            simulate_email_notification(
                user=user,
                subject='Kapita subscription revoked',
                message='Your subscription access was revoked by an administrator.',
            )
        return Response({'message': 'Subscription revoked'})


class ActivityLogView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        logs = ActivityLog.objects.select_related('actor', 'target_user', 'payment_submission')[:50]
        return Response(ActivityLogSerializer(logs, many=True).data)


class PaymentProofFileView(APIView):
    """Serve payment proof images in production (auth via header or ?token= for img tags)."""
    permission_classes = [IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        token = request.query_params.get('token')
        if token and not request.META.get('HTTP_AUTHORIZATION'):
            request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
        return super().initial(request, *args, **kwargs)

    def get(self, request, payment_id):
        payment = get_object_or_404(PaymentSubmission, pk=payment_id)

        if payment.user_id != request.user.id and not request.user.is_staff:
            return Response({'detail': 'Not allowed to view this payment proof.'}, status=status.HTTP_403_FORBIDDEN)

        if not payment.proof_image:
            return Response({'detail': 'No proof image uploaded.'}, status=status.HTTP_404_NOT_FOUND)

        content_type = 'image/jpeg'
        name = payment.proof_image.name.lower()
        if name.endswith('.png'):
            content_type = 'image/png'
        elif name.endswith('.webp'):
            content_type = 'image/webp'
        elif name.endswith('.gif'):
            content_type = 'image/gif'

        return FileResponse(payment.proof_image.open('rb'), content_type=content_type)

