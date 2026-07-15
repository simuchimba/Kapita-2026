"""
Business Health Score Calculator
Calculates a comprehensive health score for businesses based on multiple metrics
"""
from datetime import datetime, timedelta
from decimal import Decimal
from django.db.models import Sum, Avg, Count, F
from django.utils import timezone


class BusinessHealthScore:
    """
    Calculates business health score (0-100) based on:
    - Revenue trends
    - Profit margins
    - Customer retention
    - Inventory efficiency
    - Cash flow health
    - Debt management
    """
    
    def __init__(self, user):
        self.user = user
        self.scores = {}
        self.total_score = 0
        
    def calculate(self):
        """Calculate overall business health score"""
        revenue_score = self.calculate_revenue_score()
        profit_score = self.calculate_profit_score()
        customer_score = self.calculate_customer_score()
        inventory_score = self.calculate_inventory_score()
        cashflow_score = self.calculate_cashflow_score()
        debt_score = self.calculate_debt_score()
        
        self.scores = {
            'revenue': revenue_score,
            'profit': profit_score,
            'customer': customer_score,
            'inventory': inventory_score,
            'cashflow': cashflow_score,
            'debt': debt_score,
        }
        
        # Weighted average (revenue and profit have higher weight)
        weights = {
            'revenue': 0.25,
            'profit': 0.25,
            'customer': 0.15,
            'inventory': 0.15,
            'cashflow': 0.15,
            'debt': 0.05,
        }
        
        self.total_score = sum(
            self.scores[key] * weights[key] 
            for key in weights
        )
        
        return {
            'total_score': round(self.total_score, 1),
            'scores': self.scores,
            'grade': self.get_grade(),
            'recommendations': self.get_recommendations(),
            'calculated_at': timezone.now().isoformat()
        }
    
    def calculate_revenue_score(self):
        """Calculate revenue trend score (0-100)"""
        from sales.models import Sale
        
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)
        
        # Get revenue for last 30 days vs previous 30 days
        recent_sales = Sale.objects.filter(
            user=self.user,
            sale_date__gte=thirty_days_ago
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')
        
        previous_sales = Sale.objects.filter(
            user=self.user,
            sale_date__gte=sixty_days_ago,
            sale_date__lt=thirty_days_ago
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')
        
        if previous_sales == 0:
            return 50 if recent_sales > 0 else 0
        
        growth_rate = ((recent_sales - previous_sales) / previous_sales) * 100
        
        # Score based on growth rate
        if growth_rate >= 20:
            return 100
        elif growth_rate >= 10:
            return 85
        elif growth_rate >= 5:
            return 70
        elif growth_rate >= 0:
            return 60
        elif growth_rate >= -10:
            return 40
        elif growth_rate >= -20:
            return 25
        else:
            return 10
    
    def calculate_profit_score(self):
        """Calculate profit margin score (0-100)"""
        from sales.models import Sale
        from products.models import Product
        from expenses.models import Expense
        
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        
        # Calculate revenue
        revenue = Sale.objects.filter(
            user=self.user,
            sale_date__gte=thirty_days_ago
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')
        
        # Calculate cost of goods sold (simplified)
        # In production, this would use actual cost from product data
        cogs = revenue * Decimal('0.6')  # Assume 60% COGS
        
        # Calculate expenses
        expenses = Expense.objects.filter(
            user=self.user,
            date__gte=thirty_days_ago
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        if revenue == 0:
            return 0
        
        profit = revenue - cogs - expenses
        profit_margin = (profit / revenue) * 100
        
        # Score based on profit margin
        if profit_margin >= 30:
            return 100
        elif profit_margin >= 20:
            return 85
        elif profit_margin >= 15:
            return 70
        elif profit_margin >= 10:
            return 55
        elif profit_margin >= 5:
            return 40
        elif profit_margin >= 0:
            return 25
        else:
            return 10
    
    def calculate_customer_score(self):
        """Calculate customer retention score (0-100)"""
        from sales.models import Sale
        from customers.models import Customer
        
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        
        # Get repeat customers
        recent_sales = Sale.objects.filter(
            user=self.user,
            sale_date__gte=thirty_days_ago
        ).values('customer').annotate(count=Count('id'))
        
        repeat_customers = sum(1 for s in recent_sales if s['count'] > 1)
        total_customers = Customer.objects.filter(user=self.user).count()
        
        if total_customers == 0:
            return 0
        
        repeat_rate = (repeat_customers / total_customers) * 100
        
        # Score based on repeat rate
        if repeat_rate >= 60:
            return 100
        elif repeat_rate >= 40:
            return 85
        elif repeat_rate >= 30:
            return 70
        elif repeat_rate >= 20:
            return 55
        elif repeat_rate >= 10:
            return 40
        else:
            return 25
    
    def calculate_inventory_score(self):
        """Calculate inventory efficiency score (0-100)"""
        from products.models import Product
        from sales.models import Sale
        
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        
        # Get products and their sales
        products = Product.objects.filter(user=self.user)
        
        if not products.exists():
            return 50
        
        # Calculate inventory turnover
        total_stock = sum(p.stock for p in products)
        total_sales = Sale.objects.filter(
            user=self.user,
            sale_date__gte=thirty_days_ago
        ).aggregate(total_quantity=Sum('quantity'))['total_quantity'] or 0
        
        if total_stock == 0:
            return 50
        
        turnover_rate = (total_sales / total_stock) * 100
        
        # Score based on turnover rate
        if turnover_rate >= 100:
            return 100
        elif turnover_rate >= 75:
            return 85
        elif turnover_rate >= 50:
            return 70
        elif turnover_rate >= 25:
            return 55
        elif turnover_rate >= 10:
            return 40
        else:
            return 25
    
    def calculate_cashflow_score(self):
        """Calculate cash flow health score (0-100)"""
        from sales.models import Sale
        from expenses.models import Expense
        
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        
        # Cash in
        cash_in = Sale.objects.filter(
            user=self.user,
            sale_date__gte=thirty_days_ago
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')
        
        # Cash out
        cash_out = Expense.objects.filter(
            user=self.user,
            date__gte=thirty_days_ago
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        if cash_in == 0:
            return 0
        
        cashflow_ratio = ((cash_in - cash_out) / cash_in) * 100
        
        # Score based on cashflow ratio
        if cashflow_ratio >= 40:
            return 100
        elif cashflow_ratio >= 20:
            return 85
        elif cashflow_ratio >= 10:
            return 70
        elif cashflow_ratio >= 0:
            return 55
        elif cashflow_ratio >= -10:
            return 40
        elif cashflow_ratio >= -20:
            return 25
        else:
            return 10
    
    def calculate_debt_score(self):
        """Calculate debt management score (0-100)"""
        from credits.models import Credit
        
        # Get total outstanding credits
        total_credits = Credit.objects.filter(
            user=self.user
        ).aggregate(total_owed=Sum('amount_owed'))['total_owed'] or Decimal('0')
        
        total_paid = Credit.objects.filter(
            user=self.user
        ).aggregate(total_paid=Sum('amount_paid'))['total_paid'] or Decimal('0')
        
        if total_credits == 0:
            return 100  # No debt is good
        
        payment_rate = (total_paid / total_credits) * 100
        
        # Score based on payment rate
        if payment_rate >= 90:
            return 100
        elif payment_rate >= 75:
            return 85
        elif payment_rate >= 60:
            return 70
        elif payment_rate >= 50:
            return 55
        elif payment_rate >= 30:
            return 40
        else:
            return 25
    
    def get_grade(self):
        """Get letter grade for total score"""
        if self.total_score >= 90:
            return 'A'
        elif self.total_score >= 80:
            return 'B'
        elif self.total_score >= 70:
            return 'C'
        elif self.total_score >= 60:
            return 'D'
        else:
            return 'F'
    
    def get_recommendations(self):
        """Get improvement recommendations based on scores"""
        recommendations = []
        
        if self.scores.get('revenue', 0) < 60:
            recommendations.append({
                'category': 'Revenue',
                'message': 'Consider marketing strategies to boost sales growth',
                'priority': 'high'
            })
        
        if self.scores.get('profit', 0) < 60:
            recommendations.append({
                'category': 'Profit',
                'message': 'Review pricing strategy and reduce unnecessary expenses',
                'priority': 'high'
            })
        
        if self.scores.get('customer', 0) < 60:
            recommendations.append({
                'category': 'Customer',
                'message': 'Implement customer loyalty programs to improve retention',
                'priority': 'medium'
            })
        
        if self.scores.get('inventory', 0) < 60:
            recommendations.append({
                'category': 'Inventory',
                'message': 'Optimize inventory levels to improve turnover rate',
                'priority': 'medium'
            })
        
        if self.scores.get('cashflow', 0) < 60:
            recommendations.append({
                'category': 'Cashflow',
                'message': 'Focus on improving cash flow management',
                'priority': 'high'
            })
        
        if self.scores.get('debt', 0) < 60:
            recommendations.append({
                'category': 'Debt',
                'message': 'Implement stricter credit policies and follow up on payments',
                'priority': 'medium'
            })
        
        return recommendations
