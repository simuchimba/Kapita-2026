#!/bin/bash

echo "🚀 Starting Kapita Backend Server..."
echo ""

cd "$(dirname "$0")/backend"

# Activate virtual environment
source .venv/bin/activate

# Check if migrations are needed
echo "📦 Checking migrations..."
python manage.py migrate

echo ""
echo "✅ Backend starting on http://127.0.0.1:8000"
echo "📝 Press Ctrl+C to stop"
echo ""

# Start server
python manage.py runserver
