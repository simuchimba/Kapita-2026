from rest_framework import serializers
from .models import Credit, Payment
from customers.serializers import CustomerSerializer


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    
    class Meta:
        model = Payment
        fields = ['id', 'credit', 'amount', 'payment_date', 'notes', 'created_at']
        read_only_fields = ['id', 'payment_date', 'created_at']


class CreditSerializer(serializers.ModelSerializer):
    """Serializer for Credit model"""
    customer_details = CustomerSerializer(source='customer', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Credit
        fields = [
            'id', 'customer', 'customer_details', 'amount_owed',
            'amount_paid', 'remaining_balance', 'borrow_date',
            'due_date', 'status', 'is_overdue', 'notes',
            'payments', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'amount_paid', 'remaining_balance',
            'status', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['remaining_balance'] = validated_data['amount_owed']
        return super().create(validated_data)


class RecordPaymentSerializer(serializers.Serializer):
    """Serializer for recording credit payments"""
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_amount(self, value):
        credit = self.context.get('credit')
        if credit and value > credit.remaining_balance:
            raise serializers.ValidationError(
                f"Payment amount cannot exceed remaining balance of {credit.remaining_balance}"
            )
        return value
