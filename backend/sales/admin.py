from django.contrib import admin
from .models import Sale


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'product', 'customer', 'quantity',
        'total_amount', 'payment_type', 'profit', 'created_at'
    ]
    list_filter = ['payment_type', 'created_at']
    search_fields = ['product__name', 'customer__name']
    readonly_fields = ['total_amount', 'remaining_balance', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Sale Information', {
            'fields': ('user', 'product', 'customer', 'quantity', 'unit_price', 'total_amount')
        }),
        ('Payment Details', {
            'fields': ('payment_type', 'deposit_amount', 'remaining_balance', 'due_date')
        }),
        ('Additional Info', {
            'fields': ('notes', 'created_at', 'updated_at')
        }),
    )
