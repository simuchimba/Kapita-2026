#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kapita.settings')
django.setup()

from accounts.models import User

users = User.objects.all()
print(f"Total users: {users.count()}\n")

for user in users:
    print(f"Username: {user.username}")
    print(f"Email: {user.email}")
    print(f"Password hash: {user.password[:60]}...")
    print(f"Is hashed (pbkdf2): {user.password.startswith('pbkdf2_sha256')}")
    print(f"Is hashed (argon2): {user.password.startswith('argon2')}")
    print(f"Is hashed (bcrypt): {user.password.startswith('bcrypt')}")
    print("-" * 50)
