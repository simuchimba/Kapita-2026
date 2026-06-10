from django.contrib import admin
from .models import Reinvestment


@admin.register(Reinvestment)
class ReinvestmentAdmin(admin.ModelAdmin):
    list_display = [
        'purpose', 'amount', 'expected_margin',
        'projected_profit', 'date', 'created_at'
    ]
    list_filter = ['purpose', 'date', 'created_at']
    search_fields = ['notes']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Reinvestment Information', {
            'fields': ('user', 'amount', 'purpose', 'date', 'expected_margin')
        }),
        ('Additional Info', {
            'fields': ('notes', 'created_at', 'updated_at')
        }),
    )
