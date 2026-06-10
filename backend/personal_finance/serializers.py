from rest_framework import serializers
from .models import PersonalTransaction


class PersonalTransactionSerializer(serializers.ModelSerializer):
    category_label = serializers.SerializerMethodField()
    type_label = serializers.CharField(source='get_transaction_type_display', read_only=True)

    class Meta:
        model = PersonalTransaction
        fields = [
            'id', 'title', 'amount', 'transaction_type', 'type_label',
            'category', 'category_label', 'date', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'category_label', 'type_label']

    def get_category_label(self, obj):
        return obj.get_category_display()

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class PersonalSummarySerializer(serializers.Serializer):
    total_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_allowances = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    transaction_count = serializers.IntegerField()
    savings_rate = serializers.FloatField()
    by_category = serializers.DictField()
    by_type = serializers.DictField()
