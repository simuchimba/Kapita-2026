from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from products.models import Product

User = get_user_model()


class Promotion(models.Model):
    """Promotion model for managing discounts and special offers"""
    DISCOUNT_TYPES = [
        ('percentage', 'Percentage Off'),
        ('fixed', 'Fixed Amount Off'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('expired', 'Expired'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='promotions')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES, default='percentage')
    discount_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    # Optional: Apply to specific products
    products = models.ManyToManyField(Product, blank=True, related_name='promotions')
    apply_to_all_products = models.BooleanField(default=False)
    
    # Date range
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Tracking
    times_used = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'promotions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['start_date', 'end_date']),
        ]

    def __str__(self):
        return f"{self.name} - {self.discount_value}{'%' if self.discount_type == 'percentage' else ''}"

    def is_active(self):
        """Check if promotion is currently active"""
        from django.utils import timezone
        today = timezone.now().date()
        return (
            self.status == 'active' and
            self.start_date <= today <= self.end_date
        )

    def calculate_discount(self, original_price):
        """Calculate discount amount based on original price"""
        if self.discount_type == 'percentage':
            return (original_price * self.discount_value) / 100
        else:  # fixed
            return min(self.discount_value, original_price)

    def calculate_final_price(self, original_price):
        """Calculate final price after discount"""
        discount = self.calculate_discount(original_price)
        return max(original_price - discount, 0)
