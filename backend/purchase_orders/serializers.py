from rest_framework import serializers
from django.contrib.auth import get_user_model
from products.models import Product
from products.serializers import ProductSerializer
from suppliers.models import Supplier
from suppliers.serializers import SupplierSerializer
from .models import PurchaseOrder, PurchaseOrderItem

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'product', 'product_details', 'quantity', 'unit_price', 'total']
        read_only_fields = ['id', 'total']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_details = SupplierSerializer(source='supplier', read_only=True)
    user = UserSerializer(read_only=True)
    items = PurchaseOrderItemSerializer(many=True, required=False)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'user', 'supplier', 'supplier_details', 'order_date',
            'expected_delivery_date', 'status', 'total_amount',
            'notes', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'order_date', 'total_amount', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        validated_data['user'] = self.context['request'].user
        purchase_order = PurchaseOrder.objects.create(**validated_data)
        for item_data in items_data:
            PurchaseOrderItem.objects.create(purchase_order=purchase_order, **item_data)
        return purchase_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                PurchaseOrderItem.objects.create(purchase_order=instance, **item_data)

        return instance
