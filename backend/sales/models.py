from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from products.models import Product
from customers.models import Customer

User = get_user_model()


class Sale(models.Model):
    """Sale model for tracking sales transactions"""
    PAYMENT_TYPES = [
        ('cash', 'Cash'),
        ('mobile_money', 'Mobile Money'),
        ('credit', 'Credit'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sales')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='sales')
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='purchases'
    )
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Discount/Promotion fields
    discount_type = models.CharField(
        max_length=20,
        choices=[('percentage', 'Percentage'), ('fixed', 'Fixed Amount'), ('none', 'No Discount')],
        default='none',
        blank=True
    )
    discount_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        blank=True
    )
    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        blank=True
    )
    promotion_name = models.CharField(max_length=255, blank=True, null=True)
    
    currency = models.CharField(max_length=3, default='ZMW')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES)
    
    # Credit-specific fields
    deposit_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        blank=True
    )
    remaining_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        blank=True
    )
    due_date = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sales'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['payment_type']),
        ]

    def __str__(self):
        return f"Sale #{self.id} - {self.product.name}"

    @property
    def cost_of_goods(self):
        """Calculate cost of goods sold"""
        return self.quantity * self.product.buying_price

    @property
    def profit(self):
        """Calculate profit from this sale"""
        return self.total_amount - self.cost_of_goods

    @property
    def profit_margin(self):
        """Calculate profit margin percentage"""
        if self.total_amount > 0:
            return (self.profit / self.total_amount) * 100
        return 0

    def _sync_credit(self):
        from credits.models import Credit
        existing = Credit.objects.filter(
            user=self.user,
            customer=self.customer,
            status__in=['pending', 'partial']
        ).first()
        if existing:
            existing.amount_owed += self.total_amount
            existing.amount_paid += self.deposit_amount
            if self.due_date and (not existing.due_date or self.due_date > existing.due_date):
                existing.due_date = self.due_date
            existing.save()
        else:
            Credit.objects.create(
                user=self.user,
                customer=self.customer,
                amount_owed=self.total_amount,
                amount_paid=self.deposit_amount,
                currency=self.currency,
                borrow_date=timezone.now().date(),
                due_date=self.due_date or timezone.now().date(),
            )

    def save(self, *args, **kwargs):
        is_new = self.pk is None

        # Calculate discount amount
        if self.discount_type == 'percentage':
            self.discount_amount = (self.quantity * self.unit_price * self.discount_value) / 100
        elif self.discount_type == 'fixed':
            self.discount_amount = min(self.discount_value, self.quantity * self.unit_price)
        else:
            self.discount_amount = 0
        
        # Calculate total amount after discount
        subtotal = self.quantity * self.unit_price
        self.total_amount = subtotal - self.discount_amount
        
        # Calculate remaining balance for credit sales
        if self.payment_type == 'credit':
            self.remaining_balance = self.total_amount - self.deposit_amount
        
        super().save(*args, **kwargs)
        
        # Update product quantity
        self.product.quantity -= self.quantity
        self.product.save()

        # Auto-create/update Credit record for credit sales
        if is_new and self.payment_type == 'credit' and self.customer:
            self._sync_credit()
