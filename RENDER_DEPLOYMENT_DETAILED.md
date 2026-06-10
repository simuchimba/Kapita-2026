# Kapita Render Deployment Guide — Detailed Step-by-Step

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Set Up Your Neon Database](#1-set-up-your-neon-database)
3. [Deploy Your Backend to Render](#2-deploy-your-backend-to-render)
4. [Configure Environment Variables](#3-configure-environment-variables)
5. [Create an Admin User](#4-create-an-admin-user)
6. [Deploy Frontend to Vercel (Optional)](#5-deploy-frontend-to-vercel-optional)
7. [Verify Everything Works](#6-verify-everything-works)
8. [Troubleshooting Guide](#troubleshooting-guide)

---

## Prerequisites

Before you start, you will need:
1. A **GitHub or GitLab account** with your Kapita code pushed
2. A [Render account](https://dashboard.render.com/register) (free tier works great!)
3. A [Neon account](https://console.neon.tech/app/projects) (free PostgreSQL database)
4. A [Clerk account](https://dashboard.clerk.com/) (optional, for Clerk authentication)

---

## 1. Set Up Your Neon Database

Neon gives you a free, managed PostgreSQL database that's perfect for Render!

### Step 1.1: Create a Neon Project
1. Go to [Neon Console](https://console.neon.tech/app/projects)
2. Click **Sign In** → log in with GitHub/Google/email
3. Click **Create Project**
4. Fill in:
   - **Project name**: `kapita-db`
   - **Postgres version**: (keep default, latest is fine)
   - **Region**: pick the one closest to you!
5. Click **Create Project**

### Step 1.2: Copy Your Connection String
1. After project is created, you'll see a **Connection Details** box
2. Under **Connection String**, click **Copy**
   - It should look like this: `postgresql://your-user:your-password@your-hostname.us-east-2.aws.neon.tech/your-db-name?sslmode=require`
3. Save this somewhere safe! You'll need it in Step 3

---

## 2. Deploy Your Backend to Render

Render is a platform-as-a-service that makes deploying Django super easy!

### Step 2.1: Connect Your GitHub/GitLab Account
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Sign in with GitHub/GitLab/email
3. Click your profile picture in top-right → **Account Settings**
4. Under **Git**, click **Connect GitHub** (or GitLab)
5. Follow the prompts to connect and grant Render access to your Kapita repository

### Step 2.2: Create a Render Blueprint
1. From Render Dashboard, click **Blueprints** in the left sidebar
2. Click **New Blueprint**
3. Find your Kapita repository in the list and click **Connect**
4. Review the blueprint (it uses your improved `render.yaml` file!)
   - You'll see it's set to create a `kapita-api` web service on the free plan
   - The blueprint has descriptions for each env var to make it easier!
5. Click **Apply** (wait 10-15 seconds for it to set things up)

### Step 2.3: Wait for Initial Deployment
1. You'll see your `kapita-api` service being provisioned
2. Wait for the status to change from **Building** to **Live**
   - This takes 2-5 minutes the first time!
3. When it's live, you'll see a URL like `https://kapita-api.onrender.com`

---

## 3. Configure Environment Variables

Now we need to tell Render about our database and other settings!

### Step 3.1: Open Environment Settings
1. Go to your `kapita-api` service page in Render
2. Click **Environment** in the left sidebar

### Step 3.2: Add Required Variables
You will need to set these variables (the blueprint has helpful descriptions already!):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (paste your Neon connection string from Step 1.2) |
| `ALLOWED_HOSTS` | `kapita-api.onrender.com` (replace `kapita-api` with your actual service name!) |
| `CORS_ALLOWED_ORIGINS` | Your frontend URL (e.g., `https://kapita-frontend.vercel.app` or `http://localhost:3000` for local testing) |
| `CSRF_TRUSTED_ORIGINS` | Same value as `CORS_ALLOWED_ORIGINS` |

### Step 3.3: Add Clerk Variables (If Using Clerk)
If you want to use Clerk authentication, add these too:

| Variable | Value |
|----------|-------|
| `CLERK_SECRET_KEY` | (from Clerk Dashboard → **API Keys** → **Secret Key**) |
| `CLERK_AUTHORIZED_PARTIES` | Your frontend URL |

### Step 3.4: Add OpenRouter Variables (Optional, for AI Features)
If you want AI chat/analytics:

| Variable | Value |
|----------|-------|
| `OPENROUTER_API_KEY` | (from your OpenRouter account) |
| `OPENROUTER_MODEL` | (e.g., `google/gemini-2.5-flash`) |

### Step 3.5: Save and Redeploy
1. Click **Save Changes** at the bottom
2. Render will automatically redeploy your service with the new settings!
3. Wait for it to go back to **Live** status (check the **Events** tab to see progress)

---

## 4. Create an Admin User

Now let's create your first admin user to log in!

### Step 4.1: Open Render Shell
1. Go to your `kapita-api` service page in Render
2. Click **Shell** in the left sidebar
3. Wait for the shell to connect (takes 30-60 seconds)

### Step 4.2: Run the Create Admin Command
In the shell, type this and press Enter:
```bash
python manage.py create_admin
```

### Step 4.3: Follow the Prompts
You'll be asked:
1. **Email address**: enter your email
2. **Password**: enter a strong password
3. **Confirm password**: enter the same password again

That's it! Your admin user is created!

---

## 5. Deploy Frontend to Vercel (Optional)

Now let's deploy the frontend!

### Step 5.1: Import Repo to Vercel
1. Go to [Vercel New Project](https://vercel.com/new)
2. Find your Kapita repository and click **Import**

### Step 5.2: Configure Project Settings
1. Under **Project Name**, type `kapita-frontend` (or whatever you want!)
2. Under **Root Directory**, select `frontend`
3. Leave other settings as default
4. Click **Environment Variables** (expand this section!)
5. Add this variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://kapita-api.onrender.com/api` (replace `kapita-api` with your backend service name!)
6. Click **Add**
7. Click **Deploy**!

### Step 5.3: Wait for Deployment
Vercel will build and deploy your frontend in 1-3 minutes!
When it's done, you'll see your frontend URL like `https://kapita-frontend.vercel.app`

---

## 6. Verify Everything Works

Let's make sure all is up and running!

### Step 6.1: Test Backend Health Check
1. Go to `https://kapita-api.onrender.com/` (replace with your backend URL)
2. You should see a JSON response:
   ```json
   {
     "name": "Kapita API",
     "status": "ok",
     "api_base": "/api/",
     "docs_hint": "Use /api/auth/login/, /api/products/, etc."
   }
   ```

### Step 6.2: Test Django Admin
1. Go to `https://kapita-api.onrender.com/admin`
2. Log in with the admin user you created
3. You should see the Django admin dashboard!

### Step 6.3: Log In to Frontend
1. Open your frontend URL (from Vercel)
2. Log in with your admin email and password (from Step 4.3)
3. You should see the Kapita dashboard! 🎉

---

## Troubleshooting Guide

### Common Issues and Fixes

#### Problem: Blueprint Error in Render
- Make sure your `render.yaml` file is committed to your repo and in the root directory!
- Double-check the indentation in `render.yaml` (Render is picky about YAML!)

#### Problem: Database Connection Error
- Check your `DATABASE_URL` is copied correctly from Neon
- Make sure it ends with `?sslmode=require`
- Try re-creating your Neon database
- Check Render **Logs** tab for exact error messages

#### Problem: CORS Errors When Using Frontend
- Double-check `CORS_ALLOWED_ORIGINS` in Render settings
- Make sure it matches your frontend URL *exactly* (no trailing slashes!)
- Add both `http://localhost:3000` and your production frontend URL if needed
- Try redeploying your backend after changing

#### Problem: Can't Log In
- Make sure you ran `python manage.py create_admin` in Render Shell
- If you forgot your password, run this in Render Shell:
  ```bash
  python manage.py createsuperuser
  ```
  (this creates a superuser that can log in to /admin too!)

#### Problem: Deployment Fails
- Check Render's **Logs** tab for error messages
- Make sure your `requirements.txt` is up to date
- Try re-deploying manually from Render dashboard (click **Manual Deploy** → **Deploy latest commit**)
- Check that your repo has the latest `render.yaml` file!

#### Problem: Static Files Not Loading
- Make sure `DEBUG=False` is set (it is by default in our blueprint!)
- Check that `collectstatic` ran (it's part of the build command!)
- Check Render **Logs** for any static files errors

#### Problem: Outgoing Payments or Cash Flow Not Showing
- Make sure all migrations ran (they should, thanks to releaseCommand!)
- If not, run in Render Shell:
  ```bash
  python manage.py migrate
  ```

---

## 🎉 You're Done!

Congratulations! Your Kapita app is now fully deployed on Render and Vercel! 🚀

### Quick Recap of What's Live:
- ✅ Backend API: https://kapita-api.onrender.com
- ✅ PostgreSQL Database: Managed by Neon (free tier!)
- ✅ Frontend: https://kapita-frontend.vercel.app (optional)
- ✅ Admin User: Created and ready to go!
- ✅ Kapita Branded PDFs: Working perfectly!

### Next Steps:
1. Add products and customers!
2. Record sales and expenses!
3. Try the outgoing payments feature!
4. Download your first cash flow statement PDF!

Enjoy your fully deployed Kapita app! 🎊

