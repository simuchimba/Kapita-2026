from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum

from .models import Credit, Payment
from .serializers import CreditSerializer, RecordPaymentSerializer, PaymentSerializer


class CreditViewSet(viewsets.ModelViewSet):
    """ViewSet for Credit CRUD operations"""
    serializer_class = CreditSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'customer']
    search_fields = ['customer__name', 'notes']
    ordering_fields = ['due_date', 'amount_owed', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return Credit.objects.filter(user=self.request.user).select_related('customer')

    @action(detail=True, methods=['post'])
    def record_payment(self, request, pk=None):
        """Record a payment for a credit"""
        credit = self.get_object()
        serializer = RecordPaymentSerializer(
            data=request.data,
            context={'credit': credit}
        )

        if serializer.is_valid():
            # Create payment record
            payment = Payment.objects.create(
                credit=credit,
                amount=serializer.validated_data['amount'],
                notes=serializer.validated_data.get('notes', '')
            )

            return Response(
                CreditSerializer(credit).data,
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue credits"""
        credits = self.get_queryset().filter(status='overdue')
        serializer = self.get_serializer(credits, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending credits"""
        credits = self.get_queryset().filter(status__in=['pending', 'partial'])
        serializer = self.get_serializer(credits, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get credit summary statistics"""
        credits = self.get_queryset()
        
        total_owed = credits.aggregate(
            total=Sum('amount_owed')
        )['total'] or 0
        
        total_paid = credits.aggregate(
            total=Sum('amount_paid')
        )['total'] or 0
        
        total_outstanding = credits.filter(
            status__in=['pending', 'partial', 'overdue']
        ).aggregate(
            total=Sum('remaining_balance')
        )['total'] or 0
        
        overdue_count = credits.filter(status='overdue').count()
        
        return Response({
            'total_owed': total_owed,
            'total_paid': total_paid,
            'total_outstanding': total_outstanding,
            'overdue_count': overdue_count,
            'total_credits': credits.count(),
        })

    @action(detail=True, methods=['get'])
    def payment_history(self, request, pk=None):
        """Get payment history for a credit"""
        credit = self.get_object()
        payments = credit.payments.all()
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)
