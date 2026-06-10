from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import models

from .models import Product
from .serializers import ProductSerializer, ProductRestockSerializer


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for Product CRUD operations"""
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'sku', 'category', 'supplier']
    ordering_fields = ['name', 'quantity', 'selling_price', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return Product.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def restock(self, request, pk=None):
        """Restock a product"""
        product = self.get_object()
        serializer = ProductRestockSerializer(data=request.data)

        if serializer.is_valid():
            quantity = serializer.validated_data['quantity']
            product.quantity += quantity

            # Update buying price if provided
            if 'buying_price' in serializer.validated_data:
                product.buying_price = serializer.validated_data['buying_price']

            product.save()

            return Response(
                ProductSerializer(product).data,
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock"""
        products = self.get_queryset().filter(
            quantity__lte=models.F('minimum_stock')
        )
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all unique product categories"""
        categories = self.get_queryset().values_list(
            'category', flat=True
        ).distinct()
        return Response(list(categories))

    @action(detail=False, methods=['get'])
    def inventory_summary(self, request):
        """Get inventory summary statistics"""
        products = self.get_queryset()
        
        total_value = sum(p.inventory_value for p in products)
        total_potential_profit = sum(p.potential_profit for p in products)
        low_stock_count = sum(1 for p in products if p.is_low_stock)
        
        return Response({
            'total_products': products.count(),
            'total_inventory_value': total_value,
            'total_potential_profit': total_potential_profit,
            'low_stock_count': low_stock_count,
        })
