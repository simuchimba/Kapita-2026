from rest_framework import serializers
from .models import Promotion
from products.models import Product


class PromotionSerializer(serializers.ModelSerializer):
    """Serializer for Promotion model"""
    product_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Product.objects.all(),
        source='products',
        required=False
    )
    product_names = serializers.SerializerMethodField()
    is_currently_active = serializers.SerializerMethodField()

    class Meta:
        model = Promotion
        fields = [
            'id', 'name', 'description', 'discount_type', 'discount_value',
            'product_ids', 'product_names', 'apply_to_all_products',
            'start_date', 'end_date', 'status', 'times_used',
            'is_currently_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'times_used', 'created_at', 'updated_at']

    def get_product_names(self, obj):
        """Get list of product names this promotion applies to"""
        if obj.apply_to_all_products:
            return ['All Products']
        return [product.name for product in obj.products.all()]

    def get_is_currently_active(self, obj):
        """Check if promotion is currently active"""
        return obj.is_active()

    def create(self, validated_data):
        """Create promotion"""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class ApplyPromotionSerializer(serializers.Serializer):
    """Serializer for applying a promotion to calculate discount"""
    promotion_id = serializers.IntegerField()
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate(self, data):
        """Validate that the promotion can be applied to the product"""
        try:
            promotion = Promotion.objects.get(id=data['promotion_id'])
        except Promotion.DoesNotExist:
            raise serializers.ValidationError("Promotion not found")

        if not promotion.is_active():
            raise serializers.ValidationError("This promotion is not active")

        # Check if promotion applies to the product
        if not promotion.apply_to_all_products:
            if not promotion.products.filter(id=data['product_id']).exists():
                raise serializers.ValidationError(
                    "This promotion does not apply to the selected product"
                )

        data['promotion'] = promotion
        return data
