from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for Expense model"""
    
    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'amount', 'category', 'date',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ExpenseSummarySerializer(serializers.Serializer):
    """Serializer for expense summary statistics"""
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    expense_count = serializers.IntegerField()
    by_category = serializers.DictField()
