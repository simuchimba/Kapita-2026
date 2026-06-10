from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count

from .models import Reinvestment
from .serializers import ReinvestmentSerializer, ReinvestmentSummarySerializer


class ReinvestmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Reinvestment CRUD operations"""
    serializer_class = ReinvestmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['purpose', 'date']
    search_fields = ['notes']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        queryset = Reinvestment.objects.filter(user=self.request.user)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get reinvestment summary statistics"""
        reinvestments = self.get_queryset()
        
        total_reinvested = reinvestments.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        total_projected_profit = sum(r.projected_profit for r in reinvestments)
        total_projected_return = sum(r.projected_return for r in reinvestments)
        
        by_purpose = {}
        for purpose, _ in Reinvestment.PURPOSE_CHOICES:
            purpose_total = reinvestments.filter(purpose=purpose).aggregate(
                total=Sum('amount')
            )['total'] or 0
            by_purpose[purpose] = float(purpose_total)
        
        data = {
            'total_reinvested': total_reinvested,
            'total_projected_profit': total_projected_profit,
            'total_projected_return': total_projected_return,
            'reinvestment_count': reinvestments.count(),
            'by_purpose': by_purpose,
        }
        
        serializer = ReinvestmentSummarySerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_purpose(self, request):
        """Get reinvestments grouped by purpose"""
        reinvestments = self.get_queryset().values('purpose').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        return Response(list(reinvestments))

    @action(detail=False, methods=['get'])
    def purposes(self, request):
        """Get all reinvestment purposes"""
        return Response([
            {'value': purpose[0], 'label': purpose[1]}
            for purpose in Reinvestment.PURPOSE_CHOICES
        ])
