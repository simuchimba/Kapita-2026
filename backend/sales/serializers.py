from rest_framework import serializers
from customers.models import Customer
from products.models import Product
from .models import Sale
from products.serializers import ProductSerializer
from customers.serializers import CustomerSerializer


class BlankablePrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        if data in ('', None):
            return None

        return super().to_internal_value(data)


class BlankableDateField(serializers.DateField):
    def to_internal_value(self, value):
        if value in ('', None):
            return None

        return super().to_internal_value(value)


class SaleSerializer(serializers.ModelSerializer):
    """Serializer for Sale model"""
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    customer = BlankablePrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        required=False,
        allow_null=True,
    )
    due_date = BlankableDateField(required=False, allow_null=True)
    product_details = ProductSerializer(source='product', read_only=True)
    customer_details = CustomerSerializer(source='customer', read_only=True)
    cost_of_goods = serializers.ReadOnlyField()
    profit = serializers.ReadOnlyField()
    profit_margin = serializers.ReadOnlyField()

    class Meta:
        model = Sale
        fields = [
            'id', 'product', 'product_details', 'customer', 'customer_details',
            'quantity', 'unit_price', 'currency', 'discount_type', 'discount_value', 
            'discount_amount', 'promotion_name', 'total_amount', 'payment_type',
            'deposit_amount', 'remaining_balance', 'due_date', 'notes', 'source',
            'cost_of_goods', 'profit', 'profit_margin',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_amount', 'discount_amount', 'remaining_balance', 'created_at', 'updated_at']

    def validate(self, data):
        # Check if product has enough quantity
        product = data.get('product')
        quantity = data.get('quantity')
        
        if product and quantity:
            if product.quantity < quantity:
                raise serializers.ValidationError(
                    f"Insufficient stock. Available: {product.quantity}"
                )
        
        # Validate credit sale fields
        if data.get('payment_type') == 'credit':
            if not data.get('customer'):
                raise serializers.ValidationError(
                    "Customer is required for credit sales"
                )
            if not data.get('due_date'):
                raise serializers.ValidationError(
                    "Due date is required for credit sales"
                )
        
        return data

    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            data = data.copy()
        else:
            data = dict(data)

        if data.get('customer') == '':
            data['customer'] = None
        if data.get('due_date') == '':
            data['due_date'] = None

        return super().to_internal_value(data)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SalesSummarySerializer(serializers.Serializer):
    """Serializer for sales summary statistics"""
    total_sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_profit = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_transactions = serializers.IntegerField()
    cash_sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    mobile_money_sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    credit_sales = serializers.DecimalField(max_digits=12, decimal_places=2)
