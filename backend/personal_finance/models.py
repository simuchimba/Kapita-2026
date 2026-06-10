from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class PersonalTransaction(models.Model):
    """Personal money tracking — completely separate from business finances."""

    TYPE_INCOME = 'income'
    TYPE_ALLOWANCE = 'allowance'
    TYPE_EXPENSE = 'expense'

    TYPE_CHOICES = [
        (TYPE_INCOME, 'Income'),
        (TYPE_ALLOWANCE, 'Allowance'),
        (TYPE_EXPENSE, 'Expense'),
    ]

    CATEGORY_CHOICES = [
        # Income
        ('side_income', 'Side Income'),
        ('salary', 'Salary'),
        ('freelance', 'Freelance'),
        ('gift', 'Gift'),
        ('refund', 'Refund'),
        # Allowance
        ('daily_allowance', 'Daily Allowance'),
        ('weekly_allowance', 'Weekly Allowance'),
        ('pocket_money', 'Pocket Money'),
        ('family_support', 'Family Support'),
        # Expense
        ('food', 'Food & Groceries'),
        ('transport', 'Transport'),
        ('airtime', 'Airtime & Data'),
        ('entertainment', 'Entertainment'),
        ('clothing', 'Clothing'),
        ('personal_care', 'Personal Care'),
        ('subscriptions', 'Subscriptions'),
        ('savings', 'Savings Transfer'),
        ('bills', 'Personal Bills'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='personal_transactions')
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    date = models.DateField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'personal_transactions'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'transaction_type']),
            models.Index(fields=['user', 'date']),
            models.Index(fields=['user', 'category']),
        ]

    def __str__(self):
        return f"{self.title} ({self.transaction_type}) — {self.amount}"
