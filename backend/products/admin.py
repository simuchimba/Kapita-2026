from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'sku', 'category', 'quantity',
        'buying_price', 'selling_price', 'is_low_stock', 'created_at'
    ]
    list_filter = ['category', 'created_at']
    search_fields = ['name', 'sku', 'category', 'supplier']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'name', 'category', 'sku', 'description')
        }),
        ('Pricing', {
            'fields': ('buying_price', 'selling_price')
        }),
        ('Inventory', {
            'fields': ('quantity', 'minimum_stock', 'supplier')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
