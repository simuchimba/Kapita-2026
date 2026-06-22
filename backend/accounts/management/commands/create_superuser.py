#!/usr/bin/env python3
"""
Django management command to create a superuser with default credentials.
Usage: python manage.py create_superuser
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

DEFAULT_PASSWORD = 'Admin@2026!'


class Command(BaseCommand):
    help = f'Creates or updates the default superuser (admin / {DEFAULT_PASSWORD})'

    def handle(self, *args, **options):
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@kapita.com',
                'first_name': 'Kapita',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True,
            },
        )

        if not created:
            admin.first_name = 'Kapita'
            admin.last_name = 'Admin'
            admin.is_staff = True
            admin.is_superuser = True

        admin.set_password(DEFAULT_PASSWORD)
        admin.save()

        action = 'Created' if created else 'Updated'
        self.stdout.write(self.style.SUCCESS(f'{action} superuser successfully'))
        self.stdout.write(f'  Username : admin')
        self.stdout.write(f'  Password : {DEFAULT_PASSWORD}')
