# Kapita Deployment to Render

This guide will walk you through deploying your Kapita backend to Render with a PostgreSQL database.

## Prerequisites

1. A [Render account](https://dashboard.render.com/register)
2. A [Neon account](https://console.neon.tech/app/projects) (for free PostgreSQL database)
3. Your Kapita repository on GitHub/GitLab

---

## Step 1: Set Up Neon Database

1. Log in to Neon and create a new project
2. Create a PostgreSQL database (free tier)
3. Copy the **connection string** (should start with `postgresql://`)

---

## Step 2: Deploy to Render

1. Go to your Render dashboard → **Blueprints** → **New Blueprint**
2. Connect your GitHub/GitLab account
3. Select your Kapita repository
4. Review the blueprint (it uses the existing `render.yaml` file)
5. Click **Apply**
6. Wait for the deployment to finish

---

## Step 3: Configure Environment Variables

1. Go to your Render service (`kapita-api`) → **Environment**
2. Add these environment variables:
   - `DATABASE_URL`: (paste your Neon connection string)
   - `ALLOWED_HOSTS`: `kapita-api.onrender.com` (replace with your actual service domain)
   - `CORS_ALLOWED_ORIGINS`: (your frontend URL, e.g., `https://your-frontend.vercel.app`)
   - `CSRF_TRUSTED_ORIGINS`: (same as above)
3. If you're using Clerk, also add:
   - `CLERK_SECRET_KEY`: (from your Clerk dashboard)
   - `CLERK_AUTHORIZED_PARTIES`: (your frontend URL)
4. Click **Save Changes** → your service will redeploy automatically

---

## Step 4: Create Admin User

1. Once deployed, go to your Render service → **Shell**
2. Run this command:
   ```bash
   python manage.py create_admin
   ```
3. Follow the prompts to create your first admin user

---

## Step 5: Deploy Frontend (Optional)

If you want to deploy the frontend too, you can use Vercel:

1. Push your repo to GitHub
2. Go to [Vercel](https://vercel.com/new) and import your repo
3. In Vercel's environment variables, set:
   ```
   VITE_API_URL=https://your-render-service.onrender.com/api
   ```
4. Deploy!

---

## Troubleshooting

1. **Database Errors**:
   - Double-check your `DATABASE_URL`
   - Make sure Neon allows connections from Render's IPs (Neon allows all by default)

2. **CORS Errors**:
   - Verify `CORS_ALLOWED_ORIGINS` includes your exact frontend URL
   - Check for trailing slashes!

3. **Auth Errors**:
   - Make sure Clerk keys are set correctly
   - Check JWT settings in `settings.py`

---

## Quick Links

- Render Dashboard: https://dashboard.render.com
- Neon Console: https://console.neon.tech
- Clerk Dashboard: https://dashboard.clerk.com
