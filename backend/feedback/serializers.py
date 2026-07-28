from rest_framework import serializers
from .models import Feedback


class FeedbackSubmitSerializer(serializers.ModelSerializer):
    """Used by regular users to submit feedback."""

    class Meta:
        model = Feedback
        fields = ['id', 'category', 'rating', 'title', 'message', 'page', 'created_at']
        read_only_fields = ['id', 'created_at']


class FeedbackAdminSerializer(serializers.ModelSerializer):
    """Full serializer for admin panel — includes user info and status."""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    business_name = serializers.CharField(source='user.business_name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    rating_display = serializers.CharField(source='get_rating_display', read_only=True)

    class Meta:
        model = Feedback
        fields = [
            'id', 'username', 'email', 'business_name',
            'category', 'category_display',
            'rating', 'rating_display',
            'title', 'message', 'page',
            'status', 'status_display',
            'admin_notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'username', 'email', 'business_name',
            'category_display', 'status_display', 'rating_display',
            'created_at',
        ]
