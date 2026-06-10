#!/usr/bin/env python
"""Create admin user for Django admin panel"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kapita.settings')
django.setup()

from accounts.models import User

# Admin credentials
username = 'admin'
email = 'admin@kapita.com'
password = 'admin123'

# Delete if exists
User.objects.filter(username=username).delete()

# Create superuser
admin = User.objects.create_superuser(
    username=username,
    email=email,
    password=password,
    first_name='Admin',
    last_name='User',
    business_name='Kapita Admin'
)

print("=" * 60)
print("✅ ADMIN USER CREATED SUCCESSFULLY!")
print("=" * 60)
print("")
print("Django Admin Panel URL:")
print("  http://127.0.0.1:8000/admin/")
print("")
print("Admin Credentials:")
print(f"  Username: {username}")
print(f"  Password: {password}")
print("")
print("=" * 60)
