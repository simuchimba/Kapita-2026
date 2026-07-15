from django.contrib import admin
from .models import SubscriptionTier, UserSubscription, UsageLog


@admin.register(SubscriptionTier)
class SubscriptionTierAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'price_monthly', 'price_yearly', 'has_analytics', 'has_offline_mode']
    list_filter = ['has_analytics', 'has_offline_mode', 'has_api_access']
    search_fields = ['name', 'slug']


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'tier', 'status', 'start_date', 'end_date', 'is_active']
    list_filter = ['status', 'tier']
    search_fields = ['user__email', 'stripe_customer_id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(UsageLog)
class UsageLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action_type', 'timestamp']
    list_filter = ['action_type']
    search_fields = ['user__email']
    readonly_fields = ['timestamp']
