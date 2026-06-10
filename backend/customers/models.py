from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Customer(models.Model):
    """Customer model for tracking business customers"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customers')
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'name']),
        ]

    def __str__(self):
        return self.name

    @property
    def total_purchases(self):
        """Calculate total purchase amount"""
        return sum(sale.total_amount for sale in self.purchases.all())

    @property
    def outstanding_debt(self):
        """Calculate total outstanding debt"""
        return sum(
            credit.remaining_balance
            for credit in self.credits.filter(status__in=['pending', 'partial'])
        )

    @property
    def purchase_count(self):
        """Count total purchases"""
        return self.purchases.count()
