from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model"""
    is_low_stock = serializers.ReadOnlyField()
    inventory_value = serializers.ReadOnlyField()
    potential_profit = serializers.ReadOnlyField()
    profit_margin = serializers.ReadOnlyField()
    barcode_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'sku', 'buying_price',
            'selling_price', 'quantity', 'minimum_stock', 'supplier', 'barcode',
            'barcode_url', 'description', 'is_low_stock', 'inventory_value',
            'potential_profit', 'profit_margin', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_barcode_url(self, obj):
        request = self.context.get('request')
        if request and obj.barcode:
            return request.build_absolute_uri(f'/api/products/{obj.id}/barcode_image/')
        return None

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        if not validated_data.get('barcode'):
            import random, string
            prefix = ''.join(random.choices(string.ascii_uppercase, k=2))
            num = ''.join(random.choices(string.digits, k=8))
            validated_data['barcode'] = f'{prefix}-{num}'
        return super().create(validated_data)


class ProductRestockSerializer(serializers.Serializer):
    """Serializer for restocking products"""
    quantity = serializers.IntegerField(min_value=1)
    buying_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False
    )
