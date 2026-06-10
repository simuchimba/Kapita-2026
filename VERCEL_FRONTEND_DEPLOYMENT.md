# Kapita Frontend Vercel Deployment Guide - Step-by-Step

## 📋 Table of Contents
1. [Before You Start](#before-you-start)
2. [Import Repo to Vercel](#import-repo-to-vercel)
3. [Configure Project Settings](#configure-project-settings)
4. [Set Up Environment Variables](#set-up-environment-variables)
5. [Deploy!](#deploy)
6. [Configure Clerk for Production](#configure-clerk-for-production)
7. [Verify Everything Works](#verify-everything-works)
8. [Troubleshooting](#troubleshooting)

---

## Before You Start

First, make sure you have:
1. Your Kapita backend successfully deployed on Render (with working API at `https://your-kapita-api.onrender.com`)
2. A Clerk account (https://clerk.com) with your Clerk Publishable Key and Secret Key
3. Your GitHub repo with the latest code (already pushed!)

---

## Import Repo to Vercel

1. Go to https://vercel.com/new
2. **Connect your GitHub account** (if not already connected)
3. Find the `kapita` repository in the list and click **Import**
4. If you don't see it, click **Adjust GitHub App Permissions** to give Vercel access to your repo

---

## Configure Project Settings

On the "Configure Project" page:

1. **Project Name**: Enter `kapita-frontend` (or whatever name you prefer)
2. **Framework Preset**: Vercel should automatically detect "Vite" - leave this as is!
3. **Root Directory**: **VERY IMPORTANT!** Click the "Edit" button and change it from `./` to `./frontend`!
   - This tells Vercel to look for your frontend code in the `frontend` folder, not the repo root!
4. **Build Command**: Should automatically be `npm run build` (leave it!)
5. **Output Directory**: Should automatically be `dist` (leave it!)
6. **Install Command**: Should automatically be `npm install` (leave it!)

---

## Set Up Environment Variables

Still on the "Configure Project" page, **expand the "Environment Variables" section** (it's at the bottom):

### Required Environment Variables

1. **VITE_API_URL**: Enter your Render backend API URL!
   - Example: `https://kapita-api.onrender.com/api`
   - **Important**: Make sure it ends with `/api` and doesn't have a trailing slash after that!
   - Replace `kapita-api` with your actual Render backend service name!

### Optional: Clerk Environment Variables (if using Clerk auth)

If you want Clerk to work in production:
1. Go to https://dashboard.clerk.com
2. Select your Kapita application
3. Go to **API Keys** in the left sidebar
4. Under **Publishable Key**, copy the "Live" key (starts with `pk_live_...`)
5. Back in Vercel, add an environment variable:
   - **Name**: `VITE_CLERK_PUBLISHABLE_KEY`
   - **Value**: Paste your Clerk Live Publishable Key (starts with `pk_live_...`)
6. If you have other Clerk-related variables, add them too!

### Final Step for Env Vars

Click **Add** after each environment variable to save them!

---

## Deploy!

When you're done configuring everything:
1. Click the big **Deploy** button!
2. Wait for Vercel to build and deploy your app!
   - This usually takes 1-3 minutes
3. When it's done, you'll see a big green "Congratulations!" message with your new frontend URL!
   - Example URL: `https://kapita-frontend-abc123.vercel.app`

---

## Configure Clerk for Production (Important!)

If you're using Clerk auth, you need to update your Clerk settings to allow your new Vercel domain!

1. Go back to https://dashboard.clerk.com and select your Kapita app
2. Click **Domains** in the left sidebar
3. Click **Add Domain**
4. Enter your Vercel frontend URL (e.g., `https://kapita-frontend-abc123.vercel.app`)
5. Also add `https://kapita-frontend-abc123.vercel.app` without trailing slash
6. Also add `http://localhost:3000` for local development (if not already there!)
7. Click **Save**

---

## Verify Everything Works

1. **Open your new Vercel URL** in a browser!
2. **Check Logos**: Look at the top of the page - your Kapita logo should be there!
3. **Test Login**: Try logging in (both via the built-in auth and/or Clerk if you set it up!)
4. **Test Dashboard**: Check that all dashboard stats are showing!
5. **Test Outgoing Payments**: Create a test outgoing payment and download the PDF receipt!
6. **Test Cash Flow Statement**: Download the cash flow statement PDF!
7. **All Features**: Make sure everything works exactly like it did locally!

---

## Troubleshooting

### Problem: Root Directory Not Set Correctly
- **Fix**: Go to Vercel project settings → **General** → **Root Directory** → Change to `./frontend`
- Then redeploy (go to **Deployments** → click the three dots on your last deploy → **Redeploy**)

### Problem: API Not Connecting
- **Check**: Make sure your `VITE_API_URL` is correct!
- Example: `https://your-kapita-api.onrender.com/api`
- **No Trailing Slash**: It should not end with `/` after `/api`!
- **Test Backend**: Open your backend URL in a browser - you should see {"name":"Kapita API","status":"ok"}

### Problem: Logos Not Showing
- **Check**: Make sure the `./frontend/src/assets` folder has all your logo files!
- **Check**: Make sure `./frontend/src/App.jsx` or relevant components are referencing logos correctly!
- **Redeploy**: Try redeploying the frontend if you just added logos!

### Problem: Clerk Not Working in Production
- **Check**: Did you set `VITE_CLERK_PUBLISHABLE_KEY` to your **Live** key (not test!)?
- **Check**: Did you add your Vercel domain to Clerk's allowed domains?
- **Check**: Did you redeploy after setting the Clerk env var?

### Problem: Environment Variables Not Taking Effect
- **Fix**: Environment variables are only read at build time!
- So after changing them, you **must redeploy** your app!

---

## 🎉 You're Done!

Your Kapita frontend is now fully deployed on Vercel! 🚀

---

## Quick Recap of What You Did
1. ✅ Imported repo to Vercel
2. ✅ Set root directory to `./frontend`
3. ✅ Configured `VITE_API_URL`
4. ✅ (Optional) Set up Clerk env vars
5. ✅ Deployed!
6. ✅ (Optional) Configured Clerk production domains
7. ✅ Verified everything works!

Great job! 🎊
