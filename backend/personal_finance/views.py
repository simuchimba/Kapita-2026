from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import Sum, Count
from django.db.models.functions import TruncDate, TruncMonth
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import PersonalTransaction
from .serializers import PersonalSummarySerializer, PersonalTransactionSerializer


class PersonalTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = PersonalTransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['transaction_type', 'category', 'date']
    search_fields = ['title', 'notes']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        queryset = PersonalTransaction.objects.filter(user=self.request.user)
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        return queryset

    def _summary_for_queryset(self, queryset):
        total_income = queryset.filter(
            transaction_type=PersonalTransaction.TYPE_INCOME
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        total_allowances = queryset.filter(
            transaction_type=PersonalTransaction.TYPE_ALLOWANCE
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        total_expenses = queryset.filter(
            transaction_type=PersonalTransaction.TYPE_EXPENSE
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        money_in = total_income + total_allowances
        net_balance = money_in - total_expenses
        savings_rate = float((net_balance / money_in * 100) if money_in > 0 else 0)

        by_category = {}
        for category, _ in PersonalTransaction.CATEGORY_CHOICES:
            cat_total = queryset.filter(category=category).aggregate(total=Sum('amount'))['total'] or 0
            if cat_total:
                by_category[category] = float(cat_total)

        by_type = {
            'income': float(total_income),
            'allowance': float(total_allowances),
            'expense': float(total_expenses),
        }

        return {
            'total_income': total_income,
            'total_allowances': total_allowances,
            'total_expenses': total_expenses,
            'net_balance': net_balance,
            'transaction_count': queryset.count(),
            'savings_rate': round(savings_rate, 1),
            'by_category': by_category,
            'by_type': by_type,
        }

    @action(detail=False, methods=['get'])
    def summary(self, request):
        data = self._summary_for_queryset(self.get_queryset())
        serializer = PersonalSummarySerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        queryset = self.get_queryset()
        summary = self._summary_for_queryset(queryset)

        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)

        daily = queryset.filter(date__gte=start_date, date__lte=end_date).annotate(
            day=TruncDate('date')
        ).values('day', 'transaction_type').annotate(
            total=Sum('amount'),
            count=Count('id'),
        ).order_by('day')

        daily_map = {}
        for row in daily:
            day_key = row['day'].isoformat() if row['day'] else None
            if day_key not in daily_map:
                daily_map[day_key] = {'day': day_key, 'income': 0, 'allowance': 0, 'expense': 0}
            daily_map[day_key][row['transaction_type']] = float(row['total'])

        monthly = queryset.filter(
            date__gte=end_date - timedelta(days=365),
            date__lte=end_date,
        ).annotate(month=TruncMonth('date')).values('month', 'transaction_type').annotate(
            total=Sum('amount'),
        ).order_by('month')

        monthly_map = {}
        for row in monthly:
            month_key = row['month'].strftime('%Y-%m') if row['month'] else None
            if month_key not in monthly_map:
                monthly_map[month_key] = {'month': month_key, 'income': 0, 'allowance': 0, 'expense': 0}
            monthly_map[month_key][row['transaction_type']] = float(row['total'])

        expense_by_category = queryset.filter(
            transaction_type=PersonalTransaction.TYPE_EXPENSE
        ).values('category').annotate(
            total=Sum('amount'),
            count=Count('id'),
        ).order_by('-total')

        recent = PersonalTransactionSerializer(
            queryset[:8],
            many=True,
            context={'request': request},
        ).data

        return Response({
            'summary': summary,
            'daily_trend': list(daily_map.values()),
            'monthly_trend': list(monthly_map.values()),
            'expense_by_category': list(expense_by_category),
            'recent_transactions': recent,
        })

    @action(detail=False, methods=['get'])
    def categories(self, request):
        return Response([
            {'value': cat[0], 'label': cat[1]}
            for cat in PersonalTransaction.CATEGORY_CHOICES
        ])

    @action(detail=False, methods=['get'])
    def types(self, request):
        return Response([
            {'value': t[0], 'label': t[1]}
            for t in PersonalTransaction.TYPE_CHOICES
        ])
