from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['payee_name', 'amount', 'category', 'payment_date', 'status', 'user']
    list_filter = ['category', 'status', 'payment_method']
    search_fields = ['payee_name', 'description']
