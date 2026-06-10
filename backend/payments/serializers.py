from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'payee_name', 'payee_phone', 'payee_email',
            'category', 'category_display',
            'description', 'amount',
            'payment_method', 'method_display',
            'reference_number', 'payment_date',
            'status', 'status_display',
            'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
