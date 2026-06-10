from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Product(models.Model):
    """Product model for inventory management"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    sku = models.CharField(max_length=100, unique=True)
    buying_price = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.IntegerField(default=0)
    minimum_stock = models.IntegerField(default=10)
    supplier = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'category']),
            models.Index(fields=['sku']),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    @property
    def is_low_stock(self):
        """Check if product is below minimum stock threshold"""
        return self.quantity <= self.minimum_stock

    @property
    def inventory_value(self):
        """Calculate total inventory value"""
        return self.quantity * self.buying_price

    @property
    def potential_profit(self):
        """Calculate potential profit from current stock"""
        return self.quantity * (self.selling_price - self.buying_price)

    @property
    def profit_margin(self):
        """Calculate profit margin percentage"""
        if self.selling_price > 0:
            return ((self.selling_price - self.buying_price) / self.selling_price) * 100
        return 0
