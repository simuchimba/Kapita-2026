from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet for Customer CRUD operations"""
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'phone', 'email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        return Customer.objects.filter(user=self.request.user)

    @action(detail=True, methods=['get'])
    def purchase_history(self, request, pk=None):
        """Get customer's purchase history"""
        customer = self.get_object()
        purchases = customer.purchases.all().order_by('-created_at')
        
        from sales.serializers import SaleSerializer
        serializer = SaleSerializer(purchases, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def credit_history(self, request, pk=None):
        """Get customer's credit history"""
        customer = self.get_object()
        credits = customer.credits.all().order_by('-created_at')
        
        from credits.serializers import CreditSerializer
        serializer = CreditSerializer(credits, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def with_debt(self, request):
        """Get customers with outstanding debt"""
        customers = self.get_queryset()
        customers_with_debt = [
            customer for customer in customers
            if customer.outstanding_debt > 0
        ]
        serializer = self.get_serializer(customers_with_debt, many=True)
        return Response(serializer.data)
# adding all the missing code in this section to ensure that we arw buikding the right code