"""
Subscription Management Models
Handles subscription tiers, plans, and user subscriptions
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class SubscriptionTier(models.Model):
    """Subscription tier definitions"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField()
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2)
    price_yearly = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Feature limits
    max_products = models.IntegerField(default=10)
    max_sales_per_month = models.IntegerField(default=100)
    max_customers = models.IntegerField(default=50)
    max_users = models.IntegerField(default=1)
    
    # Features
    has_analytics = models.BooleanField(default=False)
    has_reports = models.BooleanField(default=False)
    has_offline_mode = models.BooleanField(default=False)
    has_api_access = models.BooleanField(default=False)
    has_priority_support = models.BooleanField(default=False)
    has_custom_branding = models.BooleanField(default=False)
    
    # Storage limits (in MB)
    storage_limit_mb = models.IntegerField(default=100)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['price_monthly']
    
    def __str__(self):
        return self.name


class UserSubscription(models.Model):
    """User subscription records"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('trial', 'Trial'),
        ('past_due', 'Past Due'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscription')
    tier = models.ForeignKey(SubscriptionTier, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial')
    
    # Subscription period
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    
    # Payment info
    stripe_subscription_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Usage tracking
    products_count = models.IntegerField(default=0)
    sales_this_month = models.IntegerField(default=0)
    customers_count = models.IntegerField(default=0)
    storage_used_mb = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.tier.name} ({self.status})"
    
    def is_active(self):
        """Check if subscription is active"""
        if self.status != 'active':
            return False
        if self.end_date and self.end_date < timezone.now():
            return False
        return True
    
    def can_add_product(self):
        """Check if user can add more products"""
        return self.products_count < self.tier.max_products
    
    def can_record_sale(self):
        """Check if user can record more sales this month"""
        return self.sales_this_month < self.tier.max_sales_per_month
    
    def can_add_customer(self):
        """Check if user can add more customers"""
        return self.customers_count < self.tier.max_customers


class UsageLog(models.Model):
    """Track usage for billing purposes"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    subscription = models.ForeignKey(UserSubscription, on_delete=models.CASCADE)
    
    action_type = models.CharField(max_length=50)  # 'product_added', 'sale_recorded', etc.
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['subscription', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.action_type} at {self.timestamp}"
