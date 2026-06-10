# 🚀 Deploy Kapita to Vercel - STEP BY STEP

## ⚡ Quick Deploy Commands

### Step 1: Authenticate with Vercel (One Time)

```bash
npx vercel login
```

**What happens:**
- A browser window will open
- Login with your Vercel account (GitHub, GitLab, or Bitbucket)
- Return to terminal after authentication

---

### Step 2: Deploy Backend

```bash
cd /Users/lbs/kapita/backend
npx vercel --prod
```

**During deployment you'll be asked:**

1. **Set up and deploy?** → Press `Y`
2. **Which scope?** → Choose your account
3. **Link to existing project?** → Press `N` (first time)
4. **What's your project's name?** → Type: `kapita-backend` (or your choice)
5. **In which directory is your code located?** → Press Enter (current directory)
6. **Want to modify settings?** → Press `N`

**Expected output:**
```
✅ Production: https://kapita-backend.vercel.app [copied to clipboard]
```

📋 **COPY THIS URL** - You'll need it for frontend!

---

### Step 3: Deploy Frontend

```bash
cd /Users/lbs/kapita/frontend
npx vercel --prod
```

**During deployment you'll be asked:**

1. **Set up and deploy?** → Press `Y`
2. **Which scope?** → Choose your account
3. **Link to existing project?** → Press `N` (first time)
4. **What's your project's name?** → Type: `kapita-frontend` (or your choice)
5. **In which directory is your code located?** → Press Enter (current directory)
6. **Want to modify settings?** → Press `N`

**Expected output:**
```
✅ Production: https://kapita-frontend.vercel.app [copied to clipboard]
```

---

## 🔧 Step 4: Configure Environment Variables

### Backend Environment Variables

1. Go to: https://vercel.com/dashboard
2. Click on `kapita-backend` project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
SECRET_KEY = django-insecure-production-change-this-key-12345
DEBUG = False
ALLOWED_HOSTS = .vercel.app
CORS_ALLOWED_ORIGINS = https://kapita-frontend.vercel.app
JWT_ACCESS_TOKEN_LIFETIME = 60
JWT_REFRESH_TOKEN_LIFETIME = 1440
DB_ENGINE = sqlite3
```

5. Click **Save**
6. Go to **Deployments** tab
7. Click **⋮** (three dots) on latest deployment
8. Click **Redeploy**

---

### Frontend Environment Variables

1. Go to: https://vercel.com/dashboard
2. Click on `kapita-frontend` project
3. Go to **Settings** → **Environment Variables**
4. Add this variable:

```
VITE_API_URL = https://kapita-backend.vercel.app/api
```

5. Click **Save**
6. Go to **Deployments** tab
7. Click **⋮** (three dots) on latest deployment
8. Click **Redeploy**

---

## ✅ Step 5: Test Deployment

1. **Visit Frontend:**
   ```
   https://kapita-frontend.vercel.app
   ```

2. **Test Registration:**
   - Click "Get Started" or "Sign Up"
   - Fill in registration form
   - Submit

3. **Test Login:**
   - Go to login page
   - Enter credentials
   - Should redirect to dashboard

4. **Test API Connection:**
   ```bash
   curl https://kapita-backend.vercel.app/api/auth/login/
   ```
   
   Expected: `{"detail":"Method \"GET\" not allowed."}`

---

## 🐛 Troubleshooting

### If Backend Deployment Fails:

**Check logs:**
```bash
cd /Users/lbs/kapita/backend
npx vercel logs
```

**Common issues:**
- Missing dependencies in `requirements.txt`
- Python version mismatch
- WSGI configuration error

**Solution:** Check error message and fix, then redeploy:
```bash
npx vercel --prod
```

---

### If Frontend Deployment Fails:

**Check logs:**
```bash
cd /Users/lbs/kapita/frontend
npx vercel logs
```

**Common issues:**
- Node modules not installed
- Build errors in code
- Missing environment variables

**Solution:** Fix errors and redeploy:
```bash
npx vercel --prod
```

---

### If Login/API Fails:

1. **Check CORS:**
   - Backend env var `CORS_ALLOWED_ORIGINS` must match frontend URL exactly
   - Include `https://` protocol

2. **Check API URL:**
   - Frontend env var `VITE_API_URL` must match backend URL
   - Include `/api` at the end

3. **Verify in browser console:**
   - Open browser DevTools (F12)
   - Check Network tab for failed requests
   - Look for CORS errors

---

## 📝 Alternative: Use Deployment Script

Instead of manual steps, run:

```bash
cd /Users/lbs/kapita
./deploy.sh
```

This will guide you through all steps automatically.

---

## 🎯 Quick Redeploy Commands

After making changes:

**Backend:**
```bash
cd /Users/lbs/kapita/backend
npx vercel --prod
```

**Frontend:**
```bash
cd /Users/lbs/kapita/frontend
npx vercel --prod
```

---

## 📊 Monitor Deployments

**View all deployments:**
```bash
npx vercel ls
```

**View logs:**
```bash
npx vercel logs [deployment-url]
```

**View project info:**
```bash
npx vercel inspect [deployment-url]
```

---

## 🔗 Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Backend Project:** https://vercel.com/[your-username]/kapita-backend
- **Frontend Project:** https://vercel.com/[your-username]/kapita-frontend
- **Docs:** https://vercel.com/docs

---

## 🎉 Success Checklist

- [ ] Vercel CLI authenticated
- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Backend environment variables set
- [ ] Frontend environment variables set
- [ ] Both projects redeployed after env vars
- [ ] Frontend loads in browser
- [ ] Can register new account
- [ ] Can login successfully
- [ ] Dashboard displays correctly
- [ ] All features working

---

## 💡 Pro Tips

1. **Use Vercel Dashboard** for easier environment variable management
2. **Enable automatic deployments** by connecting your GitHub repository
3. **Use preview deployments** for testing before production
4. **Set up custom domain** in project settings
5. **Monitor usage** in Vercel dashboard to stay within free tier limits

---

## 🚨 Important Notes

- **Free tier limits:** 100GB bandwidth, 100 hours serverless execution/month
- **SQLite limitations:** Data persists but may have limitations on Vercel
- **Consider PostgreSQL** for production (use Vercel Postgres or external provider)
- **API keys:** Never commit API keys to git, always use environment variables

---

**Ready to deploy? Start with Step 1! 🚀**
