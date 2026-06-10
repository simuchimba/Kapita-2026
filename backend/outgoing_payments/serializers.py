from rest_framework import serializers
from django.contrib.auth import get_user_model
from suppliers.models import Supplier
from suppliers.serializers import SupplierSerializer
from .models import OutgoingPayment

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class OutgoingPaymentSerializer(serializers.ModelSerializer):
    supplier_details = SupplierSerializer(source='supplier', read_only=True)
    user = UserSerializer(read_only=True)
    reference_number = serializers.CharField(source='reference', required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = OutgoingPayment
        fields = [
            'id', 'user', 'supplier', 'supplier_details',
            'payment_type', 'payment_method', 'amount',
            'reference', 'reference_number', 'notes', 'status',
            'transaction_date', 'updated_at'
        ]
        read_only_fields = ['id', 'transaction_date', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
