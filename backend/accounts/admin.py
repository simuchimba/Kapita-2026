from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'business_name', 'currency', 'created_at']
    list_filter = ['currency', 'theme', 'created_at']
    search_fields = ['username', 'email', 'business_name']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Business Info', {'fields': ('phone', 'business_name', 'currency', 'theme', 'logo')}),
        ('Receipt & Quotation Info', {'fields': ('address', 'website', 'tin', 'vat_number', 'business_registration_number')}),
        ('Bank Details', {'fields': ('bank_name', 'bank_account_name', 'bank_account_number', 'bank_sort_code', 'bank_iban', 'bank_swift')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Business Info', {'fields': ('email', 'phone', 'business_name', 'currency')}),
    )
