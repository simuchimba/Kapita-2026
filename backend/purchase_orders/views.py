from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import PurchaseOrder
from .serializers import PurchaseOrderSerializer


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for Purchase Order CRUD operations"""
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'supplier']
    search_fields = ['supplier__name']
    ordering_fields = ['order_date', 'status', 'total_amount', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return PurchaseOrder.objects.filter(user=self.request.user).prefetch_related('items', 'items__product', 'supplier')

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        """Mark Purchase Order as received and update product quantities"""
        po = self.get_object()

        if po.status == 'received':
            return Response(
                {'detail': 'Purchase Order already received'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update product quantities
        for item in po.items.all():
            product = item.product
            product.quantity += item.quantity
            product.buying_price = item.unit_price  # Update buying price to latest
            product.save()

        po.status = 'received'
        po.save()

        return Response(
            PurchaseOrderSerializer(po).data,
            status=status.HTTP_200_OK
        )
