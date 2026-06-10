# Kapita Setup Guide

## ✅ Backend & Frontend Sync Fixed

### Issues Fixed:
1. **Frontend .env file** - Was pointing to port 5000, now correctly points to port 8000
2. **Backend running** - Django server running on http://127.0.0.1:8000
3. **Login working** - Test user created and login endpoint verified
4. **CORS configured** - Frontend (localhost:5173) can communicate with backend

---

## 🚀 How to Run the Application

### Step 1: Start Backend Server

Open a terminal and run:

```bash
cd /Users/lbs/kapita/backend
source .venv/bin/activate
python manage.py runserver
```

**Backend will be available at:** http://127.0.0.1:8000

### Step 2: Start Frontend Server

Open a **NEW** terminal (keep backend running) and run:

```bash
cd /Users/lbs/kapita/frontend
npm run dev
```

**Frontend will be available at:** http://localhost:5173

---

## 🧪 Test User Credentials

A test user has been created for you:

- **Username:** `testuser`
- **Email:** `test@kapita.com`
- **Password:** `testpass123`

### To Login:
1. Go to http://localhost:5173/login
2. Enter username: `testuser`
3. Enter password: `testpass123`
4. Click "Sign in"
5. You should be redirected to the dashboard

---

## 📝 Create New Users

### Option 1: Via Frontend (Recommended)
1. Go to http://localhost:5173/register
2. Fill in all fields
3. Click "Create account"
4. You'll be redirected to login page
5. Login with your new credentials

### Option 2: Via Backend Script
```bash
cd /Users/lbs/kapita/backend
source .venv/bin/activate
python create_test_user.py
```

---

## 🔧 Configuration Files

### Backend Configuration
**File:** `/Users/lbs/kapita/backend/.env`

```env
SECRET_KEY=django-insecure-dev-key-change-in-production-12345
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database - Using SQLite for development
DB_NAME=kapita_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# AI Chat (Anthropic Claude API)
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

### Frontend Configuration
**File:** `/Users/lbs/kapita/frontend/.env`

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

**✅ This is now correctly configured!**

---

## 🔍 Troubleshooting

### Login Still Failing?

1. **Check backend is running:**
   ```bash
   curl http://127.0.0.1:8000/api/auth/login/
   ```
   Should return: `{"detail":"Method \"GET\" not allowed."}`

2. **Test login directly:**
   ```bash
   curl -X POST http://127.0.0.1:8000/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"testpass123"}'
   ```
   Should return JWT tokens (access and refresh)

3. **Check frontend .env:**
   ```bash
   cat /Users/lbs/kapita/frontend/.env
   ```
   Should show: `VITE_API_URL=http://127.0.0.1:8000/api`

4. **Restart frontend after .env changes:**
   - Stop frontend (Ctrl+C)
   - Run `npm run dev` again

### Port Already in Use?

**Backend (port 8000):**
```bash
lsof -ti:8000 | xargs kill -9
```

**Frontend (port 5173):**
```bash
lsof -ti:5173 | xargs kill -9
```

---

## 📊 Features Working

✅ User Registration
✅ User Login with JWT
✅ Password visibility toggle (eye icon)
✅ Dashboard
✅ Products Management
✅ Sales Tracking
✅ Customer Management
✅ Credits Management
✅ Expenses Tracking
✅ Reinvestments
✅ Analytics & Reports
✅ Business Projections
✅ PDF Report Generation
⚠️ AI Chat (requires Anthropic API key)

---

## 🤖 Enable AI Chat Feature

1. Get API key from: https://console.anthropic.com/
2. Add to `/Users/lbs/kapita/backend/.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```
3. Restart backend server
4. Navigate to Chat page in the app

---

## 📦 Database

**Type:** SQLite (for development)
**Location:** `/Users/lbs/kapita/backend/db.sqlite3`

**To reset database:**
```bash
cd /Users/lbs/kapita/backend
source .venv/bin/activate
rm db.sqlite3
python manage.py migrate
python create_test_user.py
```

---

## ✨ Recent Fixes Applied

1. ✅ Fixed frontend .env to point to correct backend port (8000)
2. ✅ Created test user for immediate testing
3. ✅ Verified login endpoint works correctly
4. ✅ Fixed password hashing in user registration
5. ✅ Added password visibility toggle to login/register forms
6. ✅ Cleaned up landing page hero section
7. ✅ Fixed dashboard layout issues
8. ✅ Backend and frontend are now in sync

---

## 🎯 Quick Start Commands

**Terminal 1 (Backend):**
```bash
cd /Users/lbs/kapita/backend && source .venv/bin/activate && python manage.py runserver
```

**Terminal 2 (Frontend):**
```bash
cd /Users/lbs/kapita/frontend && npm run dev
```

**Then open:** http://localhost:5173

**Login with:** `testuser` / `testpass123`

---

## 📞 Support

If you encounter any issues:
1. Check both terminals for error messages
2. Verify both servers are running
3. Check the browser console (F12) for frontend errors
4. Check backend terminal for API errors
