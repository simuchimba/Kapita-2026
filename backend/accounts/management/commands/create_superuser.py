#!/usr/bin/env python3
"""
Django management command to create a superuser with default credentials.
Usage: python manage.py create_superuser
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates a default superuser (admin/admin123) if not exists'

    def handle(self, *args, **options):
        if not User.objects.filter(username='admin').exists():
            admin = User.objects.create_superuser(
                username='admin',
                email='admin@kapita.com',
                password='admin123'
            )
            admin.first_name = 'Kapita'
            admin.last_name = 'Admin'
            admin.is_staff = True
            admin.is_superuser = True
            admin.save()
            self.stdout.write(self.style.SUCCESS('Successfully created superuser'))
            self.stdout.write('  Username: admin')
            self.stdout.write('  Password: admin123')
        else:
            self.stdout.write(self.style.WARNING('Superuser already exists'))
