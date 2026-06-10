from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Payment(models.Model):
    """Outgoing payments — to suppliers, staff, contractors, etc."""

    CATEGORY_CHOICES = [
        ('supplier', 'Supplier / Stock Purchase'),
        ('salary', 'Salary / Wages'),
        ('rent', 'Rent'),
        ('utilities', 'Utilities'),
        ('transport', 'Transport'),
        ('marketing', 'Marketing'),
        ('contractor', 'Contractor / Freelancer'),
        ('tax', 'Tax / Government'),
        ('loan_repayment', 'Loan Repayment'),
        ('other', 'Other'),
    ]

    METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('mobile_money', 'Mobile Money'),
        ('bank_transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    payee_name = models.CharField(max_length=255, help_text='Who is being paid')
    payee_phone = models.CharField(max_length=50, blank=True, null=True)
    payee_email = models.CharField(max_length=255, blank=True, null=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=30, choices=METHOD_CHOICES, default='cash')
    reference_number = models.CharField(max_length=100, blank=True, null=True, help_text='Invoice / receipt / transaction ref')
    payment_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'outgoing_payments'
        ordering = ['-payment_date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'payment_date']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return f'Payment to {self.payee_name} – {self.amount}'
