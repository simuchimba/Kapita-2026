# 🚀 KAPITA - COMMANDS TO RUN BACKEND & FRONTEND

## ✅ VERIFIED PROJECT CONFIGURATION

**Backend:** Django REST API on port 8000
**Frontend:** React + Vite on port 3000 (with proxy to backend)
**Connection:** Frontend uses `/api` which proxies to `http://localhost:8000`

---

## 📋 STEP-BY-STEP COMMANDS

### STEP 1: Open Terminal 1 - Run Backend

```bash
cd /Users/lbs/kapita/backend
source .venv/bin/activate
python manage.py runserver
```

**Expected Output:**
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

**✅ Backend will be running on:** http://127.0.0.1:8000

---

### STEP 2: Open Terminal 2 - Run Frontend

```bash
cd /Users/lbs/kapita/frontend
npm run dev
```

**Expected Output:**
```
VITE v5.0.8  ready in XXX ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**✅ Frontend will be running on:** http://localhost:3000

---

## 🌐 ACCESS THE APPLICATION

**Open your browser and go to:**
```
http://localhost:3000
```

**Test Login Credentials:**
- Username: `testuser`
- Password: `testpass123`

---

## 🔧 ONE-LINE COMMANDS (Copy & Paste)

### Backend (Terminal 1):
```bash
cd /Users/lbs/kapita/backend && source .venv/bin/activate && python manage.py runserver
```

### Frontend (Terminal 2):
```bash
cd /Users/lbs/kapita/frontend && npm run dev
```

---

## 🔍 VERIFY CONNECTION

### Test Backend API:
```bash
curl http://127.0.0.1:8000/api/auth/login/
```

**Expected:** `{"detail":"Method \"GET\" not allowed."}`

### Test Frontend Proxy:
Open browser to: http://localhost:3000
- Should load the landing page
- Click "Sign In" to test login

---

## 🛠️ TROUBLESHOOTING

### If Backend Won't Start:

**Check if port 8000 is in use:**
```bash
lsof -ti:8000
```

**Kill process on port 8000:**
```bash
lsof -ti:8000 | xargs kill -9
```

**Check Python virtual environment:**
```bash
cd /Users/lbs/kapita/backend
ls -la .venv
```

**Reinstall dependencies if needed:**
```bash
cd /Users/lbs/kapita/backend
source .venv/bin/activate
pip install -r requirements.txt
```

---

### If Frontend Won't Start:

**Check if port 3000 is in use:**
```bash
lsof -ti:3000
```

**Kill process on port 3000:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Reinstall node modules if needed:**
```bash
cd /Users/lbs/kapita/frontend
rm -rf node_modules package-lock.json
npm install
```

---

### If Login Fails:

**Create test user:**
```bash
cd /Users/lbs/kapita/backend
source .venv/bin/activate
python create_test_user.py
```

**Test login directly:**
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

**Should return JWT tokens (access and refresh)**

---

## 📊 PROJECT STRUCTURE

```
/Users/lbs/kapita/
├── backend/                 # Django REST API
│   ├── .venv/              # Python virtual environment
│   ├── manage.py           # Django management script
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Backend configuration
│   └── kapita/            # Django project settings
│
└── frontend/               # React + Vite
    ├── node_modules/      # Node dependencies
    ├── package.json       # NPM scripts & dependencies
    ├── vite.config.js     # Vite configuration (proxy setup)
    ├── .env              # Frontend configuration
    └── src/              # React source code
```

---

## 🔗 HOW THEY CONNECT

1. **Frontend** runs on `http://localhost:3000`
2. **Backend** runs on `http://localhost:8000`
3. **Vite Proxy** configured in `vite.config.js`:
   - Frontend requests to `/api/*` → Proxied to `http://localhost:8000/api/*`
   - This avoids CORS issues during development

**Example:**
- Frontend calls: `axios.get('/api/products/')`
- Vite proxies to: `http://localhost:8000/api/products/`
- Backend responds with data
- Frontend receives the response

---

## ✅ CONFIGURATION FILES

### Backend: `/Users/lbs/kapita/backend/.env`
```env
SECRET_KEY=django-insecure-dev-key-change-in-production-12345
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

### Frontend: `/Users/lbs/kapita/frontend/.env`
```env
VITE_API_URL=/api
```

### Frontend: `/Users/lbs/kapita/frontend/vite.config.js`
```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

---

## 🎯 QUICK START (2 Terminals)

**Terminal 1:**
```bash
cd /Users/lbs/kapita/backend && source .venv/bin/activate && python manage.py runserver
```

**Terminal 2:**
```bash
cd /Users/lbs/kapita/frontend && npm run dev
```

**Browser:**
```
http://localhost:3000
```

**Login:**
- Username: `testuser`
- Password: `testpass123`

---

## 📝 NOTES

- ✅ Backend and frontend are now properly configured
- ✅ Vite proxy handles API requests (no CORS issues)
- ✅ Test user created and ready to use
- ✅ All dependencies installed
- ✅ Database migrations applied

**Everything is ready to run!**
