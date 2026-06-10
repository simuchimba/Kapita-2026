#!/bin/bash

echo "🚀 Starting Kapita Frontend Server..."
echo ""

cd "$(dirname "$0")/frontend"

echo "✅ Frontend starting on http://localhost:5173"
echo "🔗 Connecting to backend at http://127.0.0.1:8000/api"
echo "📝 Press Ctrl+C to stop"
echo ""

# Start Vite dev server
npm run dev
