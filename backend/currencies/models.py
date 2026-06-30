from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Currency(models.Model):
    code = models.CharField(max_length=3, primary_key=True)
    name = models.CharField(max_length=100)
    symbol = models.CharField(max_length=10, default='')
    is_base = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'currencies'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"


class ExchangeRate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exchange_rates')
    base_currency = models.ForeignKey(Currency, on_delete=models.CASCADE, related_name='base_rates')
    target_currency = models.ForeignKey(Currency, on_delete=models.CASCADE, related_name='target_rates')
    rate = models.DecimalField(max_digits=18, decimal_places=6)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'base_currency', 'target_currency']

    def __str__(self):
        return f"1 {self.base_currency_id} = {self.rate} {self.target_currency_id}"
