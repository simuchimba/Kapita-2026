from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import models
from .models import Promotion
from .serializers import PromotionSerializer, ApplyPromotionSerializer


class PromotionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing promotions"""
    serializer_class = PromotionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter promotions by authenticated user"""
        return Promotion.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all currently active promotions"""
        today = timezone.now().date()
        promotions = self.get_queryset().filter(
            status='active',
            start_date__lte=today,
            end_date__gte=today
        )
        serializer = self.get_serializer(promotions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def calculate_discount(self, request):
        """Calculate discount for a given product and promotion"""
        serializer = ApplyPromotionSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            promotion = data['promotion']
            quantity = data['quantity']
            unit_price = data['unit_price']
            
            subtotal = quantity * unit_price
            discount_amount = promotion.calculate_discount(subtotal)
            final_total = subtotal - discount_amount
            
            return Response({
                'promotion_id': promotion.id,
                'promotion_name': promotion.name,
                'discount_type': promotion.discount_type,
                'discount_value': promotion.discount_value,
                'subtotal': subtotal,
                'discount_amount': discount_amount,
                'final_total': final_total,
                'savings_percentage': (discount_amount / subtotal * 100) if subtotal > 0 else 0
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Toggle promotion status between active and inactive"""
        promotion = self.get_object()
        if promotion.status == 'active':
            promotion.status = 'inactive'
        else:
            promotion.status = 'active'
        promotion.save()
        serializer = self.get_serializer(promotion)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def for_product(self, request):
        """Get active promotions for a specific product"""
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        today = timezone.now().date()
        promotions = self.get_queryset().filter(
            status='active',
            start_date__lte=today,
            end_date__gte=today
        ).filter(
            models.Q(apply_to_all_products=True) |
            models.Q(products__id=product_id)
        ).distinct()
        
        serializer = self.get_serializer(promotions, many=True)
        return Response(serializer.data)
