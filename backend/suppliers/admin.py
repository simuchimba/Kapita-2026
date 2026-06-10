from django.contrib import admin
from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'contact_person', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'email', 'phone']
