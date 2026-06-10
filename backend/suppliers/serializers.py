from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Supplier

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for Supplier model"""
    user = UserSerializer(read_only=True)

    class Meta:
        model = Supplier
        fields = [
            'id', 'user', 'name', 'phone', 'email', 'address',
            'contact_person', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
