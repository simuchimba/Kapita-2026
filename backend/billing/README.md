# Kapita Billing & Admin

## Admin credentials (local testing)

| Field | Value |
|-------|--------|
| **URL** | http://localhost:5173/admin/login |
| **Username** | `admin` |
| **Password** | `admin12345` |

```bash
cd backend
python manage.py migrate
python manage.py create_admin
python manage.py seed_demo_data   # optional demo users + charts
python manage.py runserver
```

## Trial & subscription rules

- **Trial:** 7 days from `date_joined` (no card required).
- **Subscription:** 30 days from payment **approval** date.
- **Access:** Enforced via `SubscriptionJWTAuthentication` on all API routes except auth + billing self-service endpoints.
- **Expired users** can still open `/api/billing/me/`, `/api/billing/history/`, and `/api/billing/submit-proof/`.

## Admin dashboard (frontend)

- URL: `/admin/login` → `/admin/overview`
- Requires `is_staff=True` user (same JWT login as users).

Create admin:

```bash
cd backend
python manage.py migrate
python manage.py create_admin --username admin --password your-secure-password
```

## Scheduled expiry

Mark past-due subscriptions as expired (run daily via cron):

```bash
python manage.py expire_subscriptions
```

## Admin API (`/api/billing/admin/`)

| Endpoint | Description |
|----------|-------------|
| `GET overview/` | Dashboard stats |
| `GET users/?search=&status=&export=csv` | User list / CSV export |
| `GET payments/?status=pending` | Payment queue |
| `POST payments/<id>/approve/` | Approve → 30-day subscription |
| `POST payments/<id>/reject/` | Reject with notes |
| `GET subscriptions/<user_id>/history/` | Subscription history |
| `POST subscriptions/<user_id>/extend/` | Extend days |
| `POST subscriptions/<user_id>/revoke/` | Revoke active subscription |
| `GET activity/` | Activity logs |

Email notifications are **simulated** (logged to console) in `billing/notifications.py`.
