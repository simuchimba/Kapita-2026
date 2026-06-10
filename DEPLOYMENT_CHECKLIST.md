# 🚀 Kapita Vercel Deployment Checklist

## ✅ Pre-Deployment

- [ ] Code is committed to Git
- [ ] All dependencies listed in requirements.txt
- [ ] All dependencies listed in package.json
- [ ] Environment variables documented
- [ ] Database choice decided (SQLite/PostgreSQL)
- [ ] API keys ready (Anthropic, etc.)

## 🔧 Configuration Files

- [x] `/vercel.json` (root)
- [x] `/backend/vercel.json`
- [x] `/frontend/vercel.json`
- [x] `/backend/vercel_app.py`
- [x] `/backend/build.sh`
- [x] `/.vercelignore`

## 🎯 Backend Deployment

### Step 1: Create Vercel Project
- [ ] Go to https://vercel.com/new
- [ ] Import repository
- [ ] Set root directory: `backend`

### Step 2: Configure Settings
- [ ] Framework: Other
- [ ] Build command: (leave empty)
- [ ] Output directory: (leave empty)
- [ ] Install command: `pip install -r requirements.txt`

### Step 3: Environment Variables
Add these in Vercel project settings:

```
SECRET_KEY = your-strong-secret-key-here
DEBUG = False
ALLOWED_HOSTS = .vercel.app
DB_ENGINE = sqlite3
CORS_ALLOWED_ORIGINS = https://your-frontend.vercel.app
JWT_ACCESS_TOKEN_LIFETIME = 60
JWT_REFRESH_TOKEN_LIFETIME = 1440
ANTHROPIC_API_KEY = your-api-key-here
```

- [ ] All environment variables added
- [ ] Deploy backend
- [ ] Copy backend URL

### Step 4: Test Backend
```bash
curl https://your-backend.vercel.app/api/auth/login/
```
- [ ] Backend accessible
- [ ] Returns expected response

## 🎨 Frontend Deployment

### Step 1: Create Vercel Project
- [ ] Create new project on Vercel
- [ ] Import same repository
- [ ] Set root directory: `frontend`

### Step 2: Configure Settings
- [ ] Framework: Vite
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Install command: `npm install`

### Step 3: Environment Variables
```
VITE_API_URL = https://your-backend.vercel.app/api
```

- [ ] Environment variable added
- [ ] Deploy frontend
- [ ] Copy frontend URL

### Step 4: Test Frontend
- [ ] Open frontend URL in browser
- [ ] Landing page loads
- [ ] Can navigate to login page

## 🔄 Connect Frontend & Backend

### Step 1: Update Backend CORS
- [ ] Go to backend project settings
- [ ] Update `CORS_ALLOWED_ORIGINS` with frontend URL
- [ ] Redeploy backend

### Step 2: Test Full Integration
- [ ] Register new account
- [ ] Receive success message
- [ ] Login with new account
- [ ] Dashboard loads
- [ ] Can create products
- [ ] Can create sales
- [ ] Can view analytics

## 📊 Database Setup (Optional - PostgreSQL)

### If using Vercel Postgres:
- [ ] Create database in Vercel Storage
- [ ] Copy connection string
- [ ] Update backend env vars:
  ```
  DB_ENGINE = postgresql
  DB_NAME = verceldb
  DB_USER = default
  DB_PASSWORD = xxx
  DB_HOST = xxx.postgres.vercel-storage.com
  DB_PORT = 5432
  ```
- [ ] Redeploy backend
- [ ] Run migrations
- [ ] Create test user

## 🔐 Security Check

- [ ] DEBUG=False in production
- [ ] Strong SECRET_KEY set
- [ ] ALLOWED_HOSTS configured
- [ ] CORS properly configured
- [ ] API keys not in code
- [ ] .env files in .gitignore
- [ ] No sensitive data in repository

## 🧪 Post-Deployment Testing

### Authentication
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens generated
- [ ] Logout works
- [ ] Password visibility toggle works

### Core Features
- [ ] Dashboard loads with data
- [ ] Products CRUD operations
- [ ] Sales tracking works
- [ ] Customer management works
- [ ] Credits management works
- [ ] Expenses tracking works
- [ ] Analytics displays correctly
- [ ] Reports generate (PDF & CSV)
- [ ] Projections display

### AI Features (if API key added)
- [ ] Chat interface loads
- [ ] Can send messages
- [ ] Receives AI responses

## 📝 Documentation

- [ ] Update README with deployment URLs
- [ ] Document environment variables
- [ ] Note any deployment-specific changes
- [ ] Update API documentation

## 🎯 Domain Setup (Optional)

- [ ] Purchase domain
- [ ] Add domain to Vercel project
- [ ] Update DNS records
- [ ] Update CORS settings with new domain
- [ ] Update environment variables
- [ ] Test with custom domain

## 🔔 Monitoring Setup

- [ ] Check Vercel analytics
- [ ] Set up error tracking (optional)
- [ ] Configure logging
- [ ] Set up uptime monitoring

## ✨ Final Steps

- [ ] All tests passing
- [ ] All features working
- [ ] Performance acceptable
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Share URLs with team
- [ ] Create user documentation

## 📞 Support Resources

- Vercel Dashboard: https://vercel.com/dashboard
- Django Docs: https://docs.djangoproject.com
- Vite Docs: https://vitejs.dev
- Project Issues: Create issue in repository

---

## 🎉 Deployment Complete!

Once all items are checked, your Kapita application is fully deployed and ready to use!

**Frontend URL:** https://your-frontend.vercel.app
**Backend URL:** https://your-backend.vercel.app/api

**Default Test User:**
- Username: testuser
- Password: testpass123

(Remember to create this user after deployment via Django admin or management command)

---

## 🔄 Maintenance

### To redeploy after changes:

1. **Push to Git:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. **Automatic deployment:**
   - Vercel auto-deploys on push
   - Check deployment status in dashboard

3. **Manual redeploy (if needed):**
   ```bash
   vercel --prod
   ```

### To update environment variables:
1. Go to project settings
2. Navigate to Environment Variables
3. Update/add variables
4. Redeploy project

---

**Congratulations on deploying Kapita! 🎊**
