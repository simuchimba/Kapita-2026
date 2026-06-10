from django.urls import path
from .views import (
    MyBillingStatusView,
    SubmitPaymentProofView,
    PaymentHistoryView,
    AdminOverviewView,
    AdminUsersView,
    AdminPaymentsView,
    ApprovePaymentView,
    RejectPaymentView,
    PaymentProofFileView,
    UserSubscriptionHistoryView,
    ExtendSubscriptionView,
    RevokeSubscriptionView,
    ActivityLogView,
)

urlpatterns = [
    path('me/', MyBillingStatusView.as_view(), name='billing-me'),
    path('submit-proof/', SubmitPaymentProofView.as_view(), name='billing-submit-proof'),
    path('history/', PaymentHistoryView.as_view(), name='billing-history'),
    path('proof/<int:payment_id>/', PaymentProofFileView.as_view(), name='billing-payment-proof'),
    path('admin/overview/', AdminOverviewView.as_view(), name='admin-overview'),
    path('admin/users/', AdminUsersView.as_view(), name='admin-users'),
    path('admin/payments/', AdminPaymentsView.as_view(), name='admin-payments'),
    path('admin/payments/<int:payment_id>/approve/', ApprovePaymentView.as_view(), name='admin-approve-payment'),
    path('admin/payments/<int:payment_id>/reject/', RejectPaymentView.as_view(), name='admin-reject-payment'),
    path('admin/subscriptions/<int:user_id>/history/', UserSubscriptionHistoryView.as_view(), name='admin-user-subscription-history'),
    path('admin/subscriptions/<int:user_id>/extend/', ExtendSubscriptionView.as_view(), name='admin-extend-subscription'),
    path('admin/subscriptions/<int:user_id>/revoke/', RevokeSubscriptionView.as_view(), name='admin-revoke-subscription'),
    path('admin/activity/', ActivityLogView.as_view(), name='admin-activity'),
]
