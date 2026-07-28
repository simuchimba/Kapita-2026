from django.contrib import admin
from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'category', 'rating', 'title', 'status', 'created_at']
    list_filter = ['status', 'category', 'rating']
    search_fields = ['title', 'message', 'user__username', 'user__email']
    readonly_fields = ['user', 'category', 'rating', 'title', 'message', 'page', 'created_at']
    ordering = ['-created_at']
