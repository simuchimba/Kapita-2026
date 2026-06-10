from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Reinvestment(models.Model):
    """Reinvestment model for tracking money reinvested into business"""
    PURPOSE_CHOICES = [
        ('new_stock', 'New Stock'),
        ('equipment', 'Equipment'),
        ('marketing', 'Marketing'),
        ('expansion', 'Expansion'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reinvestments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    purpose = models.CharField(max_length=50, choices=PURPOSE_CHOICES)
    date = models.DateField()
    expected_margin = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Expected profit margin percentage"
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reinvestments'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'purpose']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.purpose} - {self.amount}"

    @property
    def projected_profit(self):
        """Calculate projected profit from reinvestment"""
        return self.amount * (self.expected_margin / 100)

    @property
    def projected_return(self):
        """Calculate projected total return"""
        return self.amount + self.projected_profit
