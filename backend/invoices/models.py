from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField(blank=True, null=True)
    customer_phone = models.CharField(max_length=50, blank=True, null=True)
    customer_address = models.TextField(blank=True, null=True)
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    currency = models.CharField(max_length=3, default='ZMW')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_name = models.CharField(max_length=100, blank=True, null=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_name = models.CharField(max_length=100, blank=True, null=True)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True, null=True)
    terms_conditions = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'
        ordering = ['-created_at']

    def __str__(self):
        return f"Invoice {self.invoice_number}"

    @property
    def balance_due(self):
        return self.total_amount - self.amount_paid

    def calculate_totals(self):
        items = self.items.all()
        self.subtotal = sum(item.total for item in items)
        self.tax_amount = (self.subtotal * self.tax_rate) / 100 if self.tax_rate else 0
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            last = Invoice.objects.filter(user=self.user).order_by('-id').first()
            next_num = (last.id + 1) if last else 1
            year = timezone.now().year
            self.invoice_number = f"INV-{year}-{next_num:05d}"
        if self.amount_paid >= self.total_amount > 0:
            self.status = 'paid'
        super().save(*args, **kwargs)


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=500)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'invoice_items'

    def __str__(self):
        return f"{self.description} x{self.quantity}"

    def save(self, *args, **kwargs):
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        self.invoice.calculate_totals()
        self.invoice.save()
