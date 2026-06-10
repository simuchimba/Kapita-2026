# 🔐 Kapita Admin Panel Access Guide

## ✅ Admin User Created Successfully

Your admin user has been created and is ready to use.

---

## 🎯 Admin Credentials

```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT:** Change this password after first login for security.

---

## 🌐 Access Points

### 1️⃣ Kapita Admin Panel (Frontend) - **RECOMMENDED**

This is the main admin panel with comprehensive business management features.

**URL:** http://127.0.0.1:3000/admin/overview

**OR login at:** http://127.0.0.1:3000/admin/login

**Features:**
- 📊 **Dashboard Overview** - Real-time stats, charts, revenue analytics
- 👥 **Users Management** - View, search, filter, and export all users
- 💳 **Payments** - Review and approve payment submissions  
- 🔄 **Subscriptions** - Manage user access and subscription status
- 📝 **Activity Logs** - Track all admin actions and system events

**Screenshot Navigation:**
1. Open http://127.0.0.1:3000/admin/login in your browser
2. Enter username: `admin` and password: `admin123`
3. Click "Login"
4. You'll be redirected to the admin dashboard

---

### 2️⃣ Django Admin Panel (Backend)

This is the standard Django admin interface for direct database management.

**URL:** http://127.0.0.1:8000/admin/

**Features:**
- Direct database access to all models
- User CRUD operations
- Product, sales, customer management
- Credits, expenses, reinvestments
- System configuration

**Use this when you need:**
- Raw database access
- Bulk data operations
- System-level configuration

---

## 📊 Admin Panel Features Breakdown

### Dashboard Overview
- **User Statistics:**
  - Total users count
  - Active trials
  - Active subscriptions
  - Expired users
  
- **Revenue Metrics:**
  - Total revenue from approved payments
  - Pending payment verifications
  - Payment submission counts
  
- **Charts & Analytics:**
  - User access breakdown (pie chart)
  - Payment submissions by status
  - New signups trend (6 months)
  - Approved payments trend (6 months)
  - Revenue timeline
  - Platform activity (14 days)

### Users Management
- Search by name, email, or business name
- Filter by access status (trial, active, expired, etc.)
- View detailed user information:
  - Signup date
  - Trial end date
  - Days remaining
  - Last payment date
  - Expiry date
- **Export to CSV** - Download full user list

### Payments Management
- Review payment submissions
- Approve or reject payments
- View receipt images
- Track payment status
- Manage payment verifications

### Subscriptions
- View all active subscriptions
- Manage subscription status
- Track subscription history
- Handle renewals and expirations

### Activity Logs
- Monitor all admin actions
- Track user activities
- View system events
- Audit trail for compliance

---

## 🚀 Quick Start Guide

### Step 1: Login to Admin Panel
```bash
# Open in browser
http://127.0.0.1:3000/admin/login

# Enter credentials
Username: admin
Password: admin123
```

### Step 2: Explore Dashboard
- View real-time statistics
- Check recent activity
- Review pending payments (if any)

### Step 3: Manage Users
```
Navigate to: Users → Search/Filter → View Details
```

### Step 4: Review Payments
```
Navigate to: Payments → Pending → Approve/Reject
```

---

## 🔒 Security Notes

1. **Change Default Password:**
   - Go to Settings (if available) or Django admin
   - Update password to something secure

2. **Admin User is Staff:**
   - `is_staff = True` (can access admin panels)
   - `is_superuser = True` (full database access)

3. **Access Restrictions:**
   - Only staff users can access `/admin` routes
   - Regular users are redirected to `/app` routes

---

## 🛠️ Server Status

Both servers must be running for full functionality:

✅ **Backend (Django):** http://127.0.0.1:8000
✅ **Frontend (React):** http://127.0.0.1:3000

**To check servers:**
```bash
# Backend
cd /Users/lbs/kapita/backend
source .venv/bin/activate
python manage.py runserver

# Frontend (new terminal)
cd /Users/lbs/kapita/frontend
npm run dev
```

---

## 📞 Admin Tasks You Can Perform

### User Management
- ✅ View all registered users
- ✅ Search users by name/email
- ✅ Filter by subscription status
- ✅ Export user data to CSV
- ✅ View user activity history

### Payment Management
- ✅ Review payment submissions
- ✅ Approve valid payments
- ✅ Reject invalid payments
- ✅ View payment receipts
- ✅ Track revenue metrics

### Subscription Management
- ✅ View active subscriptions
- ✅ Extend trial periods
- ✅ Manually activate/deactivate users
- ✅ Track expiry dates

### Analytics & Reports
- ✅ View signup trends
- ✅ Track revenue growth
- ✅ Monitor platform activity
- ✅ Export analytics data

### System Administration
- ✅ View activity logs
- ✅ Track admin actions
- ✅ Monitor system health
- ✅ Access Django admin for advanced operations

---

## 🎨 UI Overview

The admin panel uses:
- **Primary Color:** Blue (#3b82f6)
- **Success Color:** Green (#10b981)
- **Warning Color:** Yellow (#f59e0b)
- **Danger Color:** Red (#ef4444)

Charts powered by **Recharts** library with:
- Pie charts for distributions
- Bar charts for trends
- Line charts for time-series data

---

## 🐛 Troubleshooting

### Can't Login?
1. Verify servers are running
2. Check credentials: `admin` / `admin123`
3. Try clearing browser cache
4. Check backend logs for errors

### No Data Showing?
1. Create test users if needed
2. Generate sample data (if available)
3. Check API connection

### API Errors?
1. Check backend server is running on port 8000
2. Verify frontend proxy is configured
3. Check Django admin for direct database access

---

## 📝 Next Steps

1. **Login to admin panel** at http://127.0.0.1:3000/admin/login
2. **Change the default password** for security
3. **Explore the dashboard** to familiarize yourself with features
4. **Create test users** if needed for testing
5. **Review payment workflows** if you have a billing system

---

## 🎯 Admin Panel URLs Quick Reference

| Panel | URL | Purpose |
|-------|-----|---------|
| **Login** | http://127.0.0.1:3000/admin/login | Admin login page |
| **Overview** | http://127.0.0.1:3000/admin/overview | Main dashboard |
| **Users** | http://127.0.0.1:3000/admin/users | User management |
| **Payments** | http://127.0.0.1:3000/admin/payments | Payment review |
| **Subscriptions** | http://127.0.0.1:3000/admin/subscriptions | Subscription management |
| **Activity** | http://127.0.0.1:3000/admin/activity | Activity logs |
| **Django Admin** | http://127.0.0.1:8000/admin/ | Backend admin |

---

## ✅ You're All Set!

Your admin panel is ready to use. Open http://127.0.0.1:3000/admin/login and start managing your Kapita platform!

**Happy administrating! 🚀**
