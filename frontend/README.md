# Kapita Frontend

Modern React dashboard for Kapita - Smart business tracking made simple.

## Features

- 🎨 Clean, professional SaaS UI
- 🌓 Dark mode support
- 📱 Fully responsive mobile design
- 📊 Interactive charts and analytics
- 🔐 JWT authentication
- ⚡ Fast and optimized with Vite

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- React Router v6
- Axios
- Recharts
- Zustand (State Management)
- Lucide React (Icons)

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Backend API running (see backend README)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Update `.env` with your API URL:

```
VITE_API_URL=http://localhost:8000/api
```

### Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Card.jsx
│   ├── Header.jsx
│   ├── Layout.jsx
│   ├── Loading.jsx
│   ├── Modal.jsx
│   ├── Sidebar.jsx
│   └── Table.jsx
├── pages/           # Page components
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── Analytics.jsx
│   ├── Credits.jsx
│   ├── Customers.jsx
│   ├── Dashboard.jsx
│   ├── Expenses.jsx
│   ├── Products.jsx
│   ├── Reinvestments.jsx
│   ├── Reports.jsx
│   ├── Sales.jsx
│   └── Settings.jsx
├── services/        # API services
│   └── api.js
├── store/          # State management
│   ├── authStore.js
│   └── themeStore.js
├── App.jsx
├── main.jsx
└── index.css
```

## Key Features

### Dashboard
- Real-time business metrics
- Revenue and expense trends
- Low stock alerts
- Overdue credit notifications

### Inventory Management
- Add, edit, delete products
- Track stock levels
- Low stock warnings
- Profit margin calculations

### Sales Tracking
- Record sales transactions
- Multiple payment types (Cash, Mobile Money, Credit)
- Automatic inventory updates
- Profit tracking

### Customer Management
- Customer database
- Purchase history
- Outstanding debt tracking

### Credit System
- Track customer debts
- Record payments
- Overdue alerts
- Payment history

### Expense Tracking
- Categorized expenses
- Expense analytics
- Monthly trends

### Analytics
- Capital calculator
- Cashflow analysis
- Top products
- Expense distribution

### Reports
- Daily, weekly, monthly reports
- Custom date ranges
- Export to PDF/CSV

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub

2. Import project in Vercel

3. Configure environment variables:
   - `VITE_API_URL`: Your backend API URL

4. Deploy

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Upload the `dist` folder to your hosting provider

3. Configure your web server to serve the SPA correctly (redirect all routes to index.html)

## Environment Variables

- `VITE_API_URL`: Backend API base URL (default: http://localhost:8000/api)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
