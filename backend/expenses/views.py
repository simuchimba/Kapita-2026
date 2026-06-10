from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta

from .models import Expense
from .serializers import ExpenseSerializer, ExpenseSummarySerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    """ViewSet for Expense CRUD operations"""
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'date']
    search_fields = ['title', 'notes']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        queryset = Expense.objects.filter(user=self.request.user)
        
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
        """Get expense summary statistics"""
        expenses = self.get_queryset()
        
        total_expenses = expenses.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        by_category = {}
        for category, _ in Expense.CATEGORY_CHOICES:
            category_total = expenses.filter(category=category).aggregate(
                total=Sum('amount')
            )['total'] or 0
            by_category[category] = float(category_total)
        
        data = {
            'total_expenses': total_expenses,
            'expense_count': expenses.count(),
            'by_category': by_category,
        }
        
        serializer = ExpenseSummarySerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get expenses grouped by category"""
        expenses = self.get_queryset().values('category').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        return Response(list(expenses))

    @action(detail=False, methods=['get'])
    def monthly_trend(self, request):
        """Get monthly expense trend"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)
        
        expenses = Expense.objects.filter(
            user=request.user,
            date__gte=start_date,
            date__lte=end_date
        ).annotate(month=TruncMonth('date')).values('month').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('month')
        
        return Response(list(expenses))

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all expense categories"""
        return Response([
            {'value': cat[0], 'label': cat[1]}
            for cat in Expense.CATEGORY_CHOICES
        ])
