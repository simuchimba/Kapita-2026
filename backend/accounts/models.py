import random
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.crypto import get_random_string
from django.utils.timezone import now
from datetime import timedelta


class User(AbstractUser):
    """Custom User model for Kapita"""
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    business_name = models.CharField(max_length=255, blank=True, null=True)
    currency = models.CharField(max_length=10, default='ZMW')
    theme = models.CharField(
        max_length=10,
        choices=[('light', 'Light'), ('dark', 'Dark')],
        default='light'
    )
    # Company logo for receipts/quotations
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    # Email verification
    email_verified = models.BooleanField(default=False)
    email_verification_code = models.CharField(max_length=6, blank=True, null=True)
    email_verification_code_expires_at = models.DateTimeField(blank=True, null=True)
    # Password reset
    password_reset_code = models.CharField(max_length=6, blank=True, null=True)
    password_reset_code_expires_at = models.DateTimeField(blank=True, null=True)
    # Receipt / business details shown on customer PDF receipts
    address = models.TextField(blank=True, null=True)
    website = models.CharField(max_length=255, blank=True, null=True)
    tin = models.CharField(max_length=50, blank=True, null=True, verbose_name='TIN')
    vat_number = models.CharField(max_length=50, blank=True, null=True)
    business_registration_number = models.CharField(max_length=80, blank=True, null=True)
    # Bank details for quotations
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account_number = models.CharField(max_length=50, blank=True, null=True)
    bank_sort_code = models.CharField(max_length=50, blank=True, null=True)
    bank_iban = models.CharField(max_length=100, blank=True, null=True)
    bank_swift = models.CharField(max_length=50, blank=True, null=True)
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

    def generate_email_verification_code(self):
        """Generate a new 6-digit email verification code that expires in 10 minutes"""
        self.email_verification_code = ''.join([str(random.randint(0,9)) for _ in range(6)])
        self.email_verification_code_expires_at = now() + timedelta(minutes=10)
        self.save()
        return self.email_verification_code

    def is_email_verification_code_valid(self, code):
        """Check if a verification code is valid"""
        return (
            self.email_verification_code == code and
            self.email_verification_code_expires_at and
            self.email_verification_code_expires_at > now()
        )
        
    def generate_password_reset_code(self):
        """Generate a new 6-digit password reset code that expires in 10 minutes"""
        self.password_reset_code = ''.join([str(random.randint(0,9)) for _ in range(6)])
        self.password_reset_code_expires_at = now() + timedelta(minutes=10)
        self.save()
        return self.password_reset_code

    def is_password_reset_code_valid(self, code):
        """Check if a password reset code is valid"""
        return (
            self.password_reset_code == code and
            self.password_reset_code_expires_at and
            self.password_reset_code_expires_at > now()
        )
