from django.db import models
from django.contrib.auth import get_user_model
from customers.models import Customer

User = get_user_model()


class Quotation(models.Model):
    """Quotation model for creating detailed quotations"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quotations')
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quotations'
    )
    quotation_number = models.CharField(max_length=50, unique=True, blank=True)
    subject = models.CharField(max_length=255)
    introduction = models.TextField(blank=True, null=True)

    # Pricing fields
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    vat_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    vat_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Terms fields
    delivery_period = models.CharField(max_length=255, blank=True, null=True)
    payment_terms = models.TextField(blank=True, null=True)
    warranty = models.TextField(blank=True, null=True)
    validity_period = models.CharField(max_length=255, blank=True, null=True)
    terms_and_conditions = models.TextField(blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quotations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Quotation {self.quotation_number} - {self.subject}"

    def save(self, *args, **kwargs):
        if not self.quotation_number:
            # Generate quotation number
            last_quotation = Quotation.objects.filter(user=self.user).order_by('-id').first()
            if last_quotation:
                last_id = last_quotation.id
            else:
                last_id = 0
            self.quotation_number = f'QTN-{self.created_at.year if self.created_at else models.DateTimeField(auto_now_add=True).year}-{last_id + 1:05d}'
        
        # Calculate totals
        self.subtotal = sum(item.total for item in self.items.all())
        self.vat_amount = (self.subtotal * self.vat_percentage) / 100
        self.total_amount = self.subtotal + self.vat_amount
        
        super().save(*args, **kwargs)


class QuotationItem(models.Model):
    """Item in a quotation"""
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='items')
    description = models.TextField()
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        db_table = 'quotation_items'
        ordering = ['id']

    def __str__(self):
        return f"{self.description} - {self.quantity} x {self.unit_price}"

    def save(self, *args, **kwargs):
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)
