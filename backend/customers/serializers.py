from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer model"""
    total_purchases = serializers.ReadOnlyField()
    outstanding_debt = serializers.ReadOnlyField()
    purchase_count = serializers.ReadOnlyField()

    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'phone', 'email', 'address', 'notes',
            'total_purchases', 'outstanding_debt', 'purchase_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
