# Clerk authentication setup

Kapita uses the official [`@clerk/react`](https://clerk.com/docs/react/getting-started/quickstart) SDK with Vite. Admin login still uses the local Django account at `/admin/login`.

When `VITE_CLERK_PUBLISHABLE_KEY` is **not** set, the app falls back to built-in username/password auth.

| Next.js / legacy | Kapita (current) |
|------------------|------------------|
| `@clerk/nextjs` | `@clerk/react` |
| `@clerk/clerk-react` | `@clerk/react` (replaced) |
| `<SignedIn>` / `<SignedOut>` | `<Show when="signed-in">` / `<Show when="signed-out">` |
| `publishableKey` prop on provider | Passed from `VITE_CLERK_PUBLISHABLE_KEY` in `main.jsx` |

---

## 1. Create a Clerk application

1. Sign up at [clerk.com](https://clerk.com)
2. Create an application
3. On [API keys](https://dashboard.clerk.com/~/api-keys), choose **React** and copy:
   - **Publishable key** → frontend
   - **Secret key** → backend

---

## 2. Configure allowed origins

In the Clerk dashboard, add your frontend URLs under **Domains / Allowed origins**, e.g.:

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `https://your-app.vercel.app`

Set the same values in backend `CLERK_AUTHORIZED_PARTIES` (comma-separated).

---

## 3. Environment variables

**Frontend** — create `frontend/.env.local` (preferred for local dev):

```env
VITE_API_URL=/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

**Backend** (`backend/.env`):

```env
CLERK_SECRET_KEY=sk_test_...
CLERK_AUTHORIZED_PARTIES=http://localhost:3000,http://127.0.0.1:3000
```

Restart both servers after changing env vars.

---

## 4. How it works in Kapita

| File | Role |
|------|------|
| `main.jsx` | `<ClerkProvider publishableKey={...} afterSignOutUrl="/">` wraps the app |
| `ClerkAuthBridge.jsx` | Syncs Clerk session → Django profile via `/api/auth/me/` |
| `LandingAuthNav.jsx` | `<Show>`, `<SignInButton>`, `<SignUpButton>`, `<UserButton>` on landing |
| `Login.jsx` / `Register.jsx` | Clerk `<SignIn />` / `<SignUp />` |
| `accounts/clerk_auth.py` | Django verifies Clerk session tokens |

New Clerk users get a Django account on first API request (7-day trial applies). Existing users with the same email are linked automatically.

### Sync existing Kapita users to Clerk

If users registered **before** Clerk was enabled, run:

```bash
cd backend
source venv/bin/activate
python manage.py sync_clerk_users --create-missing
```

This links Kapita accounts to Clerk by **email** and creates Clerk users where missing. Staff/admin accounts are skipped by default.

Users can then sign in via Clerk using their **same email** (email code / password), or use **username & password** on the login page fallback.

---

## 5. Production (Render + Vercel)

**Vercel** — add `VITE_CLERK_PUBLISHABLE_KEY` and rebuild.

**Render** — add:

```
CLERK_SECRET_KEY=sk_live_...
CLERK_AUTHORIZED_PARTIES=https://your-app.vercel.app
```

Also add your production URL to Clerk allowed origins and to `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` on Render.

---

## 6. Disable Clerk (local dev without Clerk)

Remove or comment out `VITE_CLERK_PUBLISHABLE_KEY` in `frontend/.env.local`. The app uses the original login/register forms and SimpleJWT tokens.
