from rest_framework import serializers
from customers.models import Customer
from customers.serializers import CustomerSerializer
from .models import Quotation, QuotationItem


class BlankablePrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        if data in ('', None):
            return None
        return super().to_internal_value(data)


class QuotationItemSerializer(serializers.ModelSerializer):
    """Serializer for QuotationItem model"""
    class Meta:
        model = QuotationItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'total']
        read_only_fields = ['id', 'total']


class QuotationSerializer(serializers.ModelSerializer):
    """Serializer for Quotation model"""
    customer = BlankablePrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        required=False,
        allow_null=True,
    )
    customer_details = CustomerSerializer(source='customer', read_only=True)
    items = QuotationItemSerializer(many=True, required=True)

    class Meta:
        model = Quotation
        fields = [
            'id', 'customer', 'customer_details', 'quotation_number', 'subject',
            'introduction', 'subtotal', 'vat_percentage', 'vat_amount',
            'total_amount', 'delivery_period', 'payment_terms', 'warranty',
            'validity_period', 'terms_and_conditions', 'status', 'notes',
            'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'quotation_number', 'subtotal', 'vat_amount', 'total_amount', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            data = data.copy()
        else:
            data = dict(data)
        if data.get('customer') == '':
            data['customer'] = None
        return super().to_internal_value(data)

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        validated_data['user'] = self.context['request'].user
        quotation = Quotation.objects.create(**validated_data)
        for item_data in items_data:
            QuotationItem.objects.create(quotation=quotation, **item_data)
        # Calculate totals after items are saved
        quotation.calculate_totals()
        quotation.save()
        return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                QuotationItem.objects.create(quotation=instance, **item_data)
        # Calculate totals after items are updated
        instance.calculate_totals()
        instance.save()
        return instance
