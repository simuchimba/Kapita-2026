from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'business_name', 'currency', 'created_at']
    list_filter = ['currency', 'theme', 'created_at']
    search_fields = ['username', 'email', 'business_name']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Business Info', {'fields': ('phone', 'business_name', 'currency', 'theme')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Business Info', {'fields': ('email', 'phone', 'business_name', 'currency')}),
    )
