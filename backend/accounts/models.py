from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model for Kapita"""
    clerk_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    business_name = models.CharField(max_length=255, blank=True, null=True)
    currency = models.CharField(max_length=10, default='ZMW')
    theme = models.CharField(
        max_length=10,
        choices=[('light', 'Light'), ('dark', 'Dark')],
        default='light'
    )
    # Receipt / business details shown on customer PDF receipts
    address = models.TextField(blank=True, null=True)
    website = models.CharField(max_length=255, blank=True, null=True)
    tin = models.CharField(max_length=50, blank=True, null=True, verbose_name='TIN')
    vat_number = models.CharField(max_length=50, blank=True, null=True)
    business_registration_number = models.CharField(max_length=80, blank=True, null=True)
    receipt_tagline = models.CharField(
        max_length=255,
        blank=True,
        default='Official proof of purchase',
    )
    receipt_thank_you = models.TextField(
        blank=True,
        default='Thank you for your purchase! We appreciate your business.',
    )
    receipt_return_policy = models.TextField(
        blank=True,
        default='Return/Exchange Policy: Items may be returned within 7 days with proof of purchase, subject to inspection.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return self.email
