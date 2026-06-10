from django.db import models
from django.contrib.auth import get_user_model
from suppliers.models import Supplier

User = get_user_model()


class OutgoingPayment(models.Model):
    """Model for outgoing payments (to suppliers, staff, etc.)"""
    PAYMENT_TYPE_CHOICES = [
        ('supplier', 'Supplier Payment'),
        ('staff', 'Staff Salary/Wages'),
        ('utilities', 'Utilities'),
        ('rent', 'Rent'),
        ('other', 'Other Expense'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('mobile_money', 'Mobile Money'),
        ('bank_transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='outgoing_payments')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, blank=True, null=True, related_name='payments')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='other')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    transaction_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'outgoing_payments_transactions'
        ordering = ['-transaction_date', '-id']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_type']),
        ]

    def __str__(self):
        return f"Payment #{self.id} - {self.get_payment_type_display()} - {self.amount}"
