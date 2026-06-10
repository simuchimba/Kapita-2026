from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Expense(models.Model):
    """Expense model for tracking business expenses"""
    CATEGORY_CHOICES = [
        ('rent', 'Rent'),
        ('utilities', 'Utilities'),
        ('airtime', 'Airtime'),
        ('transport', 'Transport'),
        ('stock_purchase', 'Stock Purchase'),
        ('marketing', 'Marketing'),
        ('salaries', 'Salaries'),
        ('personal_withdrawal', 'Personal Withdrawal'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    date = models.DateField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expenses'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'category']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.title} - {self.amount}"
