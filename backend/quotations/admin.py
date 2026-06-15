from django.contrib import admin
from .models import Quotation, QuotationItem


class QuotationItemInline(admin.TabularInline):
    model = QuotationItem
    extra = 1


@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'quotation_number', 'subject', 'customer',
        'total_amount', 'status', 'created_at'
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['quotation_number', 'subject', 'customer__name']
    readonly_fields = ['quotation_number', 'subtotal', 'vat_amount', 'total_amount', 'created_at', 'updated_at']
    inlines = [QuotationItemInline]
