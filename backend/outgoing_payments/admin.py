from django.contrib import admin
from .models import OutgoingPayment


@admin.register(OutgoingPayment)
class OutgoingPaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'payment_type', 'amount', 'status', 'transaction_date']
    list_filter = ['status', 'payment_type', 'payment_method', 'transaction_date']
    search_fields = ['reference', 'notes', 'supplier__name', 'user__email']
