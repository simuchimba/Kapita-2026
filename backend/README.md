# Kapita Backend API

Django REST API for Kapita - Smart business tracking made simple.

## Features

- JWT Authentication
- Product/Inventory Management
- Sales Tracking
- Customer Management
- Credit/Debt Tracking
- Expense Management
- Reinvestment Tracking
- Analytics & Reports
- Notifications
- Capital Calculator
- Cashflow Management

## Tech Stack

- Python 3.10+
- Django 4.2
- Django REST Framework
- SQLite for local development
- PostgreSQL for production deployment
- JWT Authentication

## Setup Instructions

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### 4. Database Setup

Local development uses SQLite automatically, so no database setup is required.

If you deploy to Render or another hosted PostgreSQL environment, configure the `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` variables there.

### 5. Create the SQLite Tables

```bash
python manage.py migrate --run-syncdb
```

### 6. Create Superuser

```bash
python manage.py createsuperuser
```

### 7. Run Development Server

```bash
python manage.py runserver
```

API will be available at `http://localhost:8000`

### Local Test Login

Use these credentials with the local SQLite database:

```text
Username: testuser
Password: Test@12345
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login (get JWT tokens)
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user info
- `GET /api/auth/profile/` - Get/Update profile
- `POST /api/auth/change-password/` - Change password

### Products
- `GET /api/products/` - List products
- `POST /api/products/` - Create product
- `GET /api/products/{id}/` - Get product details
- `PUT /api/products/{id}/` - Update product
- `DELETE /api/products/{id}/` - Delete product
- `POST /api/products/{id}/restock/` - Restock product
- `GET /api/products/low_stock/` - Get low stock products
- `GET /api/products/inventory_summary/` - Get inventory summary

### Sales
- `GET /api/sales/` - List sales
- `POST /api/sales/` - Create sale
- `GET /api/sales/{id}/` - Get sale details
- `GET /api/sales/summary/` - Get sales summary
- `GET /api/sales/daily_sales/` - Get daily sales trend
- `GET /api/sales/top_products/` - Get top selling products

### Customers
- `GET /api/customers/` - List customers
- `POST /api/customers/` - Create customer
- `GET /api/customers/{id}/` - Get customer details
- `PUT /api/customers/{id}/` - Update customer
- `DELETE /api/customers/{id}/` - Delete customer
- `GET /api/customers/{id}/purchase_history/` - Get purchase history
- `GET /api/customers/with_debt/` - Get customers with debt

### Credits
- `GET /api/credits/` - List credits
- `POST /api/credits/` - Create credit
- `GET /api/credits/{id}/` - Get credit details
- `POST /api/credits/{id}/record_payment/` - Record payment
- `GET /api/credits/overdue/` - Get overdue credits
- `GET /api/credits/summary/` - Get credit summary

### Expenses
- `GET /api/expenses/` - List expenses
- `POST /api/expenses/` - Create expense
- `GET /api/expenses/{id}/` - Get expense details
- `PUT /api/expenses/{id}/` - Update expense
- `DELETE /api/expenses/{id}/` - Delete expense
- `GET /api/expenses/summary/` - Get expense summary
- `GET /api/expenses/by_category/` - Get expenses by category

### Reinvestments
- `GET /api/reinvestments/` - List reinvestments
- `POST /api/reinvestments/` - Create reinvestment
- `GET /api/reinvestments/summary/` - Get reinvestment summary

### Analytics
- `GET /api/analytics/dashboard/` - Get dashboard summary
- `GET /api/analytics/capital/` - Get capital calculation
- `GET /api/analytics/cashflow/` - Get cashflow data
- `GET /api/analytics/reports/` - Generate reports

### Notifications
- `GET /api/notifications/` - List notifications
- `GET /api/notifications/unread/` - Get unread notifications
- `PATCH /api/notifications/{id}/mark_read/` - Mark as read
- `POST /api/notifications/mark_all_read/` - Mark all as read

## Deployment

### Railway/Render

1. Add a persistent disk and mount it at `/var/data` for the SQLite database.
2. Set `RENDER=true`, `DEBUG=false`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS`.
3. Deploy from GitHub.
4. Run migrations:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

The Render release command is configured to run `python manage.py migrate --run-syncdb --noinput` so the app tables are created even without migration files.

### Environment Variables for Production

```
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com
DB_NAME=kapita_db
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=your-db-host
DB_PORT=5432
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## License

MIT
