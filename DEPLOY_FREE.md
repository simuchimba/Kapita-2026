# Free hosting: Backend + Database

Kapita can run **100% free** for testing using:

| Part | Service | Cost |
|------|---------|------|
| **Backend API** | [Render](https://render.com) Free | $0 |
| **Database** | [Neon](https://neon.tech) Free Postgres | $0 |
| **Frontend** | [Vercel](https://vercel.com) Hobby | $0 |

---

## Step 1 — Free PostgreSQL (Neon)

1. Go to **[neon.tech](https://neon.tech)** and sign up (GitHub is fine).
2. Create a project, e.g. `kapita`.
3. Open **Dashboard → Connection details**.
4. Copy the **connection string** (starts with `postgresql://...`).
   - Use the **pooled** connection string if offered (better for serverless/free hosts).
   - Must include `?sslmode=require` (Neon adds this by default).

Example:
```
postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```

Keep this secret — you'll paste it into Render as `DATABASE_URL`.

---

## Step 2 — Backend on Render (free)

1. Push your code to **GitHub**.
2. Go to **[render.com](https://render.com)** → **New → Blueprint**.
3. Connect the repo — Render reads `render.yaml` at the repo root.
4. In the deploy screen, set these **Environment Variables**:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Your Neon connection string |
| `ALLOWED_HOSTS` | `your-app-name.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` (after Step 3) |
| `CSRF_TRUSTED_ORIGINS` | Same as CORS |

5. Click **Apply** / deploy.

6. After deploy succeeds, open **Shell** on Render and run:
```bash
python manage.py create_admin
```

Your API will be at: `https://your-app-name.onrender.com/api`

**Note:** Render free tier sleeps after ~15 min idle. First request after sleep may take 30–60 seconds.

---

## Step 3 — Frontend on Vercel (free)

1. Go to **[vercel.com](https://vercel.com)** → Import Git repo.
2. Set **Root Directory** to `frontend`.
3. Add environment variable:

```
VITE_API_URL=https://your-app-name.onrender.com/api
```

4. Deploy.

5. Copy your Vercel URL (e.g. `https://kapita.vercel.app`) and update Render env vars:
   - `CORS_ALLOWED_ORIGINS=https://kapita.vercel.app`
   - `CSRF_TRUSTED_ORIGINS=https://kapita.vercel.app`

6. Redeploy backend (or save env vars — Render auto-redeploys).

---

## Step 4 — Verify

```bash
curl https://your-app-name.onrender.com/
# {"name": "Kapita API", "status": "ok", ...}

curl -X POST https://your-app-name.onrender.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin12345"}'
```

Open your Vercel URL → login → test dashboard, sales, reports.

---

## Free tier limits (good to know)

| Limit | Detail |
|-------|--------|
| Render sleep | API spins down when idle; slow first load |
| Neon storage | ~512 MB on free tier — plenty for testing |
| Neon compute | Free hours/month; fine for small teams |
| Vercel | 100 GB bandwidth/month on hobby |
| Payment proof uploads | Stored on Render ephemeral disk unless you add S3 later |

---

## Alternative free databases

If Neon doesn't work for you:

- **[Supabase](https://supabase.com)** — free Postgres, use connection string as `DATABASE_URL`
- **[Railway](https://railway.app)** — $5/month credit; can host both API + Postgres in one project

---

## Local dev with Postgres (optional)

```bash
# backend/.env
DATABASE_URL=postgresql://user:pass@localhost:5432/kapita
```

Then:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Without `DATABASE_URL`, local dev still uses **SQLite** automatically.
