#!/usr/bin/env python
"""Create a test user for Kapita"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kapita.settings')
django.setup()

from accounts.models import User

# Create test user
username = 'testuser'
email = 'test@kapita.com'
password = 'testpass123'

# Delete if exists
User.objects.filter(username=username).delete()

# Create new user
user = User.objects.create_user(
    username=username,
    email=email,
    password=password,
    first_name='Test',
    last_name='User',
    business_name='Test Business'
)

print(f"✅ Test user created successfully!")
print(f"Username: {username}")
print(f"Email: {email}")
print(f"Password: {password}")
print(f"\nYou can now login with these credentials.")
