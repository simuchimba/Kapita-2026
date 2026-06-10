from django.contrib import admin
from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['title', 'amount', 'category', 'date', 'created_at']
    list_filter = ['category', 'date', 'created_at']
    search_fields = ['title', 'notes']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Expense Information', {
            'fields': ('user', 'title', 'amount', 'category', 'date')
        }),
        ('Additional Info', {
            'fields': ('notes', 'created_at', 'updated_at')
        }),
    )
