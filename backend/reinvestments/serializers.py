from rest_framework import serializers
from .models import Reinvestment


class ReinvestmentSerializer(serializers.ModelSerializer):
    """Serializer for Reinvestment model"""
    projected_profit = serializers.ReadOnlyField()
    projected_return = serializers.ReadOnlyField()

    class Meta:
        model = Reinvestment
        fields = [
            'id', 'amount', 'purpose', 'date', 'expected_margin',
            'projected_profit', 'projected_return', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ReinvestmentSummarySerializer(serializers.Serializer):
    """Serializer for reinvestment summary statistics"""
    total_reinvested = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_projected_profit = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_projected_return = serializers.DecimalField(max_digits=12, decimal_places=2)
    reinvestment_count = serializers.IntegerField()
    by_purpose = serializers.DictField()
