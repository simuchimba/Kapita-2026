from django.contrib import admin
from .models import Credit, Payment


@admin.register(Credit)
class CreditAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'customer', 'amount_owed', 'amount_paid',
        'remaining_balance', 'status', 'due_date', 'is_overdue'
    ]
    list_filter = ['status', 'due_date', 'created_at']
    search_fields = ['customer__name']
    readonly_fields = ['remaining_balance', 'status', 'created_at', 'updated_at']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'credit', 'amount', 'payment_date', 'created_at']
    list_filter = ['payment_date', 'created_at']
    search_fields = ['credit__customer__name']
    readonly_fields = ['payment_date', 'created_at']
