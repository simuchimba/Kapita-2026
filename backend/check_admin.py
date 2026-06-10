#!/usr/bin/env python
"""Check admin user details"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kapita.settings')
django.setup()

from accounts.models import User

try:
    admin = User.objects.get(username='admin')
    print("=" * 70)
    print("✅ ADMIN USER FOUND")
    print("=" * 70)
    print("")
    print("User Details:")
    print(f"  Username: {admin.username}")
    print(f"  Email: {admin.email}")
    print(f"  Is Staff: {admin.is_staff}")
    print(f"  Is Superuser: {admin.is_superuser}")
    print(f"  Business Name: {admin.business_name}")
    print("")
    print("=" * 70)
    print("ACCESS POINTS")
    print("=" * 70)
    print("")
    print("🔹 Django Admin Panel (Backend):")
    print("   URL: http://127.0.0.1:8000/admin/")
    print("   Username: admin")
    print("   Password: admin123")
    print("")
    print("🔹 Kapita Admin Panel (Frontend):")
    print("   URL: http://127.0.0.1:3000/admin/overview")
    print("   OR login at: http://127.0.0.1:3000/admin/login")
    print("   Username: admin")
    print("   Password: admin123")
    print("")
    print("=" * 70)
    print("ADMIN PANEL FEATURES")
    print("=" * 70)
    print("")
    print("• Dashboard Overview - User stats, revenue, activity charts")
    print("• Users Management - View, search, filter, export all users")
    print("• Payments - Review and approve payment submissions")
    print("• Subscriptions - Manage user subscriptions and access")
    print("• Activity Logs - Track all admin actions and system events")
    print("")
    print("=" * 70)
    
except User.DoesNotExist:
    print("=" * 70)
    print("❌ ADMIN USER NOT FOUND")
    print("=" * 70)
    print("")
    print("Run this command to create the admin user:")
    print("  python create_admin.py")
    print("")
