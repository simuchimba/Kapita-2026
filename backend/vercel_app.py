"""
Vercel WSGI handler for Django
"""
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(__file__))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kapita.settings')

# Import Django WSGI application
from kapita.wsgi import application

# Vercel expects 'app' or 'application'
app = application
