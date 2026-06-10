from django.contrib import admin
from .models import PersonalTransaction


@admin.register(PersonalTransaction)
class PersonalTransactionAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'transaction_type', 'amount', 'category', 'date')
    list_filter = ('transaction_type', 'category', 'date')
    search_fields = ('title', 'user__username', 'notes')
