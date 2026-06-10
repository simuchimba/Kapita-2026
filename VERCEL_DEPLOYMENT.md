# Vercel Deployment Guide for Kapita

## 📋 Prerequisites

1. A Vercel account (https://vercel.com)
2. Vercel CLI installed: `npm install -g vercel`
3. Git repository (recommended)

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Prepare Your Repository

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

#### Step 2: Deploy Backend (Django API)

1. Go to https://vercel.com/new
2. Import your repository
3. Set **Root Directory**: `backend`
4. **Framework Preset**: Other
5. **Build Command**: Leave empty
6. **Output Directory**: Leave empty
7. **Install Command**: `pip install -r requirements.txt`

**Environment Variables (Add these in Vercel dashboard):**

```env
SECRET_KEY=your-production-secret-key-here
DEBUG=False
ALLOWED_HOSTS=.vercel.app
DB_ENGINE=sqlite3
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440
ANTHROPIC_API_KEY=your-anthropic-api-key-here
RENDER=False
```

8. Click **Deploy**

#### Step 3: Deploy Frontend (React + Vite)

1. Create a new project on Vercel
2. Import the same repository
3. Set **Root Directory**: `frontend`
4. **Framework Preset**: Vite
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. **Install Command**: `npm install`

**Environment Variables:**

```env
VITE_API_URL=https://your-backend.vercel.app/api
```

8. Click **Deploy**

#### Step 4: Update Frontend with Backend URL

After backend is deployed:

1. Copy your backend URL (e.g., `https://kapita-backend.vercel.app`)
2. Go to your frontend project settings
3. Update `VITE_API_URL` to: `https://your-backend.vercel.app/api`
4. Redeploy frontend

---

### Option 2: Deploy via Vercel CLI

#### Backend Deployment

```bash
cd backend
vercel --prod
```

When prompted:
- Project name: `kapita-backend`
- Root directory: `.` (current directory)

Set environment variables:
```bash
vercel env add SECRET_KEY
vercel env add DEBUG
vercel env add ALLOWED_HOSTS
vercel env add CORS_ALLOWED_ORIGINS
```

#### Frontend Deployment

```bash
cd frontend
vercel --prod
```

When prompted:
- Project name: `kapita-frontend`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Set environment variables:
```bash
vercel env add VITE_API_URL
```

---

## 🔧 Configuration Files Created

### 1. `/vercel.json` (Root - Monorepo setup)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "backend/kapita/wsgi.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "backend/kapita/wsgi.py" },
    { "src": "/(.*)", "dest": "frontend/$1" }
  ]
}
```

### 2. `/backend/vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "kapita/wsgi.py",
      "use": "@vercel/python",
      "config": { "maxLambdaSize": "15mb" }
    }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "kapita/wsgi.py" }
  ]
}
```

### 3. `/frontend/vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-url.vercel.app/api/:path*"
    }
  ]
}
```

### 4. `/backend/vercel_app.py`
WSGI handler for Vercel Python runtime

### 5. `/backend/build.sh`
Build script for Django (collectstatic, migrations)

---

## 🔐 Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | `django-insecure-prod-key-xxx` |
| `DEBUG` | Debug mode | `False` |
| `ALLOWED_HOSTS` | Allowed hosts | `.vercel.app,yourdomain.com` |
| `DB_ENGINE` | Database engine | `sqlite3` or `postgresql` |
| `CORS_ALLOWED_ORIGINS` | CORS origins | `https://frontend.vercel.app` |
| `JWT_ACCESS_TOKEN_LIFETIME` | JWT expiry (minutes) | `60` |
| `JWT_REFRESH_TOKEN_LIFETIME` | Refresh token expiry | `1440` |
| `ANTHROPIC_API_KEY` | Claude API key | `sk-ant-xxx` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://backend.vercel.app/api` |

---

## 📊 Database Options

### Option 1: SQLite (Simple, for testing)
- Already configured
- Limited storage on Vercel
- Data may be lost on redeployment

### Option 2: PostgreSQL (Recommended for production)

1. **Use Vercel Postgres:**
   - Go to your project → Storage → Create Database
   - Select PostgreSQL
   - Copy connection string

2. **Update environment variables:**
   ```env
   DB_ENGINE=postgresql
   DB_NAME=verceldb
   DB_USER=default
   DB_PASSWORD=xxx
   DB_HOST=xxx.postgres.vercel-storage.com
   DB_PORT=5432
   ```

3. **Update settings.py** (already configured to use env vars)

### Option 3: External Database (Neon, Supabase, PlanetScale)

1. Create database on your chosen provider
2. Get connection string
3. Add to Vercel environment variables

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables set correctly
- [ ] Frontend can communicate with backend
- [ ] Database migrations run successfully
- [ ] Static files served correctly
- [ ] Test user registration
- [ ] Test user login
- [ ] Test all API endpoints
- [ ] CORS configured correctly
- [ ] JWT tokens working

---

## 🧪 Testing Deployment

### Test Backend:
```bash
curl https://your-backend.vercel.app/api/auth/login/
```

Expected: `{"detail":"Method \"GET\" not allowed."}`

### Test Frontend:
Open: `https://your-frontend.vercel.app`

Should see the landing page

### Test Full Flow:
1. Register a new account
2. Login
3. Navigate to dashboard
4. Test creating products, sales, etc.

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "ModuleNotFoundError"**
- Check `requirements.txt` is complete
- Verify all dependencies are listed

**Error: "DisallowedHost"**
- Add your Vercel URL to `ALLOWED_HOSTS` in environment variables
- Format: `.vercel.app` or specific `your-app.vercel.app`

**Error: "CORS error"**
- Update `CORS_ALLOWED_ORIGINS` with frontend URL
- Make sure it's the full URL with `https://`

### Frontend Issues

**Error: "Failed to fetch"**
- Check `VITE_API_URL` environment variable
- Verify backend is deployed and accessible
- Check browser console for CORS errors

**Error: "404 on routes"**
- Vite should handle routing automatically
- Check `vercel.json` has correct rewrites

### Database Issues

**Error: "no such table"**
- Migrations didn't run
- Check build logs
- May need to run migrations manually

---

## 🔄 Redeployment

### To redeploy:

**Via Dashboard:**
1. Push changes to your repository
2. Vercel auto-deploys on push

**Via CLI:**
```bash
cd backend
vercel --prod

cd ../frontend
vercel --prod
```

---

## 📝 Additional Notes

1. **Free Tier Limits:**
   - 100GB bandwidth/month
   - 100 hours serverless function execution
   - 6,000 minutes build time

2. **Custom Domain:**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Update DNS records

3. **Monitoring:**
   - Check logs in Vercel dashboard
   - Set up error tracking (Sentry, etc.)

4. **Scaling:**
   - Vercel auto-scales serverless functions
   - Consider dedicated backend for heavy loads

---

## 🎯 Quick Deploy Commands

```bash
# Deploy everything at once
cd /Users/lbs/kapita

# Deploy backend
cd backend && vercel --prod

# Deploy frontend
cd ../frontend && vercel --prod
```

---

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Django Deployment: https://docs.djangoproject.com/en/4.2/howto/deployment/
- Vite Deployment: https://vitejs.dev/guide/static-deploy.html

---

**Your deployment is now ready!** 🎉
