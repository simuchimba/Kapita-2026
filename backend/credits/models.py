from django.db import models
from django.contrib.auth import get_user_model
from customers.models import Customer
from django.utils import timezone

User = get_user_model()


class Credit(models.Model):
    """Credit model for tracking customer debts"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partial Payment'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='credits')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='credits')
    amount_owed = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_balance = models.DecimalField(max_digits=12, decimal_places=2)
    borrow_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'credits'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return f"Credit #{self.id} - {self.customer.name}"

    @property
    def is_overdue(self):
        """Check if credit is overdue"""
        return self.due_date < timezone.now().date() and self.status != 'paid'

    def save(self, *args, **kwargs):
        # Calculate remaining balance
        self.remaining_balance = self.amount_owed - self.amount_paid
        
        # Update status based on payment
        if self.remaining_balance <= 0:
            self.status = 'paid'
        elif self.amount_paid > 0:
            self.status = 'partial'
        elif self.is_overdue:
            self.status = 'overdue'
        else:
            self.status = 'pending'
        
        super().save(*args, **kwargs)


class Payment(models.Model):
    """Payment model for tracking credit payments"""
    credit = models.ForeignKey(Credit, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment #{self.id} - {self.amount}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Update credit amount paid
        self.credit.amount_paid += self.amount
        self.credit.save()
