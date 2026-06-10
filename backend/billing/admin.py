from django.contrib import admin
from .models import PaymentSubmission, Subscription, ActivityLog


@admin.register(PaymentSubmission)
class PaymentSubmissionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'transaction_id', 'amount', 'status', 'created_at', 'reviewed_at']
    list_filter = ['status', 'created_at', 'reviewed_at']
    search_fields = ['user__username', 'user__email', 'transaction_id']
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'start_date', 'end_date', 'status', 'created_at']
    list_filter = ['status', 'start_date', 'end_date']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'action', 'actor', 'target_user', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['actor__username', 'target_user__username', 'action']
    readonly_fields = ['created_at']
