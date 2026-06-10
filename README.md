# Kapita - Smart Business Tracking Made Simple

A modern, full-stack web application for small businesses in Africa (especially Zambia) to track inventory, sales, customers, credits, expenses, and business capital.

![Kapita Dashboard](https://via.placeholder.com/800x400?text=Kapita+Dashboard)

## 🚀 Features

### Core Functionality
- **Dashboard**: Real-time business metrics and analytics
- **Inventory Management**: Track products, stock levels, and profit margins
- **Sales Tracking**: Record sales with multiple payment types
- **Customer Management**: Maintain customer database with purchase history
- **Credit System**: Track customer debts and payments
- **Expense Tracking**: Categorize and analyze business expenses
- **Reinvestment Tracker**: Monitor money reinvested into business
- **Capital Calculator**: Automatic business capital calculation
- **Cashflow Management**: Track money in and money out
- **Analytics**: Advanced insights and metrics
- **Reports**: Generate daily, weekly, monthly, and custom reports

### Technical Features
- JWT Authentication
- RESTful API
- Dark mode support
- Mobile responsive design
- Real-time calculations
- Interactive charts
- Export to PDF/CSV

## 🛠️ Tech Stack

### Backend
- Python 3.11
- Django 4.2
- Django REST Framework
- SQLite for local development
- PostgreSQL on Render deployment
- JWT Authentication

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router v6
- Recharts
- Axios
- Zustand

## 📋 Prerequisites

- Python 3.10+
- Node.js 16+
- npm or yarn

## 🔧 Installation

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
cp .env.example .env
```

5. Update `.env` only if you want to override the defaults. Local development now uses SQLite by default.

6. Create the SQLite tables:
```bash
python manage.py migrate --run-syncdb
```

7. Create superuser:
```bash
python manage.py createsuperuser
```

8. Run development server:
```bash
python manage.py runserver
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your API URL:
```
VITE_API_URL=http://localhost:8000/api
```

5. Run development server:
```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

### Run Backend and Frontend Together (local)

Open two terminals or use a terminal multiplexer and run the following:

1) Start backend (from repo root):
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

2) Start frontend (from repo root):
```bash
cd frontend
npm install
npm run dev
```

Notes:
- Local development uses SQLite, so no database server is required to run the backend on your machine.
- The frontend expects the API at `http://localhost:8000/api` by default; update `VITE_API_URL` in `frontend/.env` if different.

### Local Test Login

Use these credentials to test the app locally:

```text
Username: testuser
Password: Test@12345
```

## 📱 Usage

1. Register a new account at `/register`
2. Login with your credentials
3. Start adding products to your inventory
4. Record sales transactions
5. Track customer credits
6. Monitor expenses
7. View analytics and generate reports

## 🚀 Deployment

### Backend (Railway/Render)

1. Add a persistent disk in Render and mount it at `/var/data` so the SQLite database survives deploys.
2. Set `RENDER=true`, `DEBUG=false`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` in Render.
3. Deploy from GitHub.
4. Let the release command run `python manage.py migrate --run-syncdb --noinput`.

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set `VITE_API_URL` environment variable
4. Deploy

## 📊 Database Schema

### Core Models
- **User**: Custom user model with business info
- **Product**: Inventory items with pricing and stock
- **Sale**: Sales transactions with payment types
- **Customer**: Customer information and history
- **Credit**: Customer debt tracking
- **Payment**: Credit payment records
- **Expense**: Business expense tracking
- **Reinvestment**: Business reinvestment records
- **Notification**: System notifications

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register/` - Register
- `POST /api/auth/login/` - Login
- `POST /api/auth/token/refresh/` - Refresh token
- `GET /api/auth/me/` - Get user info

### Products
- `GET /api/products/` - List products
- `POST /api/products/` - Create product
- `GET /api/products/{id}/` - Get product
- `PUT /api/products/{id}/` - Update product
- `DELETE /api/products/{id}/` - Delete product

### Sales
- `GET /api/sales/` - List sales
- `POST /api/sales/` - Create sale
- `GET /api/sales/summary/` - Get summary

### Customers
- `GET /api/customers/` - List customers
- `POST /api/customers/` - Create customer

### Credits
- `GET /api/credits/` - List credits
- `POST /api/credits/` - Create credit
- `POST /api/credits/{id}/record_payment/` - Record payment

### Expenses
- `GET /api/expenses/` - List expenses
- `POST /api/expenses/` - Create expense

### Analytics
- `GET /api/analytics/dashboard/` - Dashboard data
- `GET /api/analytics/capital/` - Capital calculation
- `GET /api/analytics/cashflow/` - Cashflow data
- `GET /api/analytics/reports/` - Generate reports

## 🎨 Design System

### Colors
- Primary: Emerald Green (#10b981)
- Secondary: Dark Navy (#0f172a)
- Accent: Blue (#3b82f6)
- Danger: Red (#ef4444)

### Components
- Cards with soft shadows
- Rounded corners
- Clean typography
- Consistent spacing
- Accessible color contrast

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Built for small businesses in Zambia and Africa
- Inspired by the need for simple, effective business tracking
- Designed with mobile-first approach for accessibility

## 📞 Support

For support, email support@kapita.com or open an issue in the repository.

## 🗺️ Roadmap

- [ ] Mobile apps (iOS/Android)
- [ ] Multi-currency support
- [ ] Invoice generation
- [ ] SMS notifications
- [ ] Barcode scanning
- [ ] Multi-user support
- [ ] Role-based permissions
- [ ] Backup and restore
- [ ] Integration with mobile money APIs
- [ ] Offline mode

---

**Kapita** - Smart business tracking made simple 🚀
