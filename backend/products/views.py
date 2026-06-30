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
    search_fields = ['name', 'sku', 'barcode', 'category', 'supplier']
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

    @action(detail=False, methods=['get'])
    def barcode_lookup(self, request):
        code = request.query_params.get('code', '')
        if not code:
            return Response({'error': 'barcode code required'}, status=400)
        product = self.get_queryset().filter(barcode=code).first()
        if not product:
            return Response({'error': 'Product not found'}, status=404)
        return Response(ProductSerializer(product).data)

    @action(detail=True, methods=['get'])
    def barcode_image(self, request, pk=None):
        product = self.get_object()
        code = product.barcode or product.sku
        try:
            import io
            from PIL import Image, ImageDraw, ImageFont
            img = Image.new('RGB', (400, 100), 'white')
            draw = ImageDraw.Draw(img)
            try:
                font = ImageFont.truetype("arial.ttf", 20)
            except (OSError, IOError):
                font = ImageFont.load_default()

            x = 20
            bars = []
            for ch in str(code):
                v = (ord(ch) % 10) + 1
                for i in range(v):
                    bars.append(x + i * 2)
                x += v * 2 + 2

            draw.rectangle([0, 0, 400, 80], fill='white')
            for bx in bars:
                if bx < 400:
                    draw.rectangle([bx, 5, bx + 2, 70], fill='black')

            bbox = draw.textbbox((0, 0), str(code), font=font)
            tw = bbox[2] - bbox[0]
            draw.text(((400 - tw) // 2, 75), str(code), fill='black', font=font)

            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            from django.http import FileResponse
            return FileResponse(buffer, content_type='image/png')
        except Exception as e:
            return Response({'error': str(e)}, status=500)
