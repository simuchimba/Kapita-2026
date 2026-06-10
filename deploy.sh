#!/bin/bash

# Kapita Vercel Deployment Script
# This script will guide you through deploying both backend and frontend to Vercel

set -e  # Exit on error

echo "🚀 Kapita Vercel Deployment Script"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
echo "📦 Checking Vercel CLI..."
if ! command -v vercel &> /dev/null && ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Login to Vercel
echo ""
echo "🔐 Logging into Vercel..."
echo -e "${YELLOW}Please follow the authentication prompts in your browser${NC}"
npx vercel login

# Deploy Backend
echo ""
echo "================================================"
echo "📡 Deploying Backend (Django API)"
echo "================================================"
cd backend

echo ""
echo "Running pre-deployment checks..."

# Check if required files exist
if [ ! -f "kapita/wsgi.py" ]; then
    echo -e "${RED}❌ Error: kapita/wsgi.py not found${NC}"
    exit 1
fi

if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}❌ Error: requirements.txt not found${NC}"
    exit 1
fi

if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ Error: vercel.json not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All required files present${NC}"

# Deploy backend
echo ""
echo "🚀 Deploying backend..."
echo -e "${YELLOW}Note: You will be prompted to set up the project${NC}"
echo "  - Project name: kapita-backend (or your choice)"
echo "  - Setup and deploy: Yes"
echo ""

npx vercel --prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
    BACKEND_URL=$(npx vercel --prod --yes 2>/dev/null | grep -o 'https://[^ ]*' | head -1)
    echo -e "${GREEN}Backend URL: ${BACKEND_URL}${NC}"
    echo ""
    echo "📝 Save this URL - you'll need it for frontend deployment"
    echo ""
else
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
fi

cd ..

# Deploy Frontend
echo ""
echo "================================================"
echo "🎨 Deploying Frontend (React + Vite)"
echo "================================================"
cd frontend

echo ""
echo "Running pre-deployment checks..."

# Check if required files exist
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    exit 1
fi

if [ ! -f "vite.config.js" ]; then
    echo -e "${RED}❌ Error: vite.config.js not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All required files present${NC}"

# Prompt for backend URL if needed
echo ""
echo "🔗 Frontend needs to connect to backend"
if [ -z "$BACKEND_URL" ]; then
    echo -e "${YELLOW}Please enter your backend URL (from previous step):${NC}"
    read -p "Backend URL: " BACKEND_URL
fi

# Deploy frontend
echo ""
echo "🚀 Deploying frontend..."
echo -e "${YELLOW}Note: You will be prompted to set up the project${NC}"
echo "  - Project name: kapita-frontend (or your choice)"
echo "  - Framework: Vite"
echo "  - Build command: npm run build"
echo "  - Output directory: dist"
echo ""

npx vercel --prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
    FRONTEND_URL=$(npx vercel --prod --yes 2>/dev/null | grep -o 'https://[^ ]*' | head -1)
    echo -e "${GREEN}Frontend URL: ${FRONTEND_URL}${NC}"
else
    echo -e "${RED}❌ Frontend deployment failed${NC}"
    exit 1
fi

cd ..

# Post-deployment instructions
echo ""
echo "================================================"
echo "🎉 Deployment Complete!"
echo "================================================"
echo ""
echo -e "${GREEN}Your application is now live!${NC}"
echo ""
echo "📌 URLs:"
echo "  Backend:  ${BACKEND_URL}"
echo "  Frontend: ${FRONTEND_URL}"
echo ""
echo "⚠️  IMPORTANT: Post-Deployment Steps"
echo "================================================"
echo ""
echo "1. Update Backend Environment Variables:"
echo "   Go to: https://vercel.com/dashboard"
echo "   Navigate to your backend project → Settings → Environment Variables"
echo "   Add:"
echo "   - SECRET_KEY=your-strong-secret-key"
echo "   - DEBUG=False"
echo "   - ALLOWED_HOSTS=.vercel.app"
echo "   - CORS_ALLOWED_ORIGINS=${FRONTEND_URL}"
echo ""
echo "2. Update Frontend Environment Variables:"
echo "   Navigate to your frontend project → Settings → Environment Variables"
echo "   Add:"
echo "   - VITE_API_URL=${BACKEND_URL}/api"
echo ""
echo "3. Redeploy Both Projects:"
echo "   After adding environment variables, redeploy both projects"
echo "   from the Vercel dashboard"
echo ""
echo "4. Test Your Deployment:"
echo "   - Visit ${FRONTEND_URL}"
echo "   - Try registering a new account"
echo "   - Test login"
echo "   - Check all features"
echo ""
echo "📚 For detailed instructions, see VERCEL_DEPLOYMENT.md"
echo ""
