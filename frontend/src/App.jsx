import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { getPostAuthPath } from './utils/postAuthPath'
import Layout from './components/Layout'
import Loading from './components/Loading'
import PostAuthRedirect from './components/PostAuthRedirect'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Quotations from './pages/Quotations'
import Promotions from './pages/Promotions'
import Suppliers from './pages/Suppliers'
import PurchaseOrders from './pages/PurchaseOrders'
import Customers from './pages/Customers'
import Credits from './pages/Credits'
import Expenses from './pages/Expenses'
import Reinvestments from './pages/Reinvestments'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Projections from './pages/Projections'
import Chat from './pages/Chat'
import Billing from './pages/Billing'
import PersonalFinance from './pages/personal/PersonalFinance'
import OutgoingPayments from './pages/OutgoingPayments'
import CashFlowStatement from './pages/CashFlowStatement'
import AdminLogin from './pages/admin/Login'
import AdminLayout from './components/AdminLayout'
import AdminOverview from './pages/admin/Overview'
import AdminUsers from './pages/admin/Users'
import AdminPayments from './pages/admin/Payments'
import AdminSubscriptions from './pages/admin/Subscriptions'
import AdminActivity from './pages/admin/Activity'
import AdminFeedback from './pages/admin/Feedback'

import NotFound from './pages/NotFound'

function UserArea({ children }) {
  const location = useLocation()
  const { user } = useAuthStore()

  if (user?.is_staff) {
    return <Navigate to="/admin/overview" replace />
  }

  const billingOnly =
    user?.access_status === 'expired' ||
    user?.access_status === 'pending_payment_verification'

  if (billingOnly && location.pathname !== '/app/billing') {
    return <Navigate to="/app/billing" replace />
  }

  return children
}

function AdminArea({ children }) {
  const { user } = useAuthStore()
  if (!user?.is_staff) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

function AuthGate({ children }) {
  const { isAuthenticated, user, sessionLoading } = useAuthStore()

  if (sessionLoading) {
    return <Loading fullScreen message="Loading your workspace…" />
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicAuthRoute({ children }) {
  const { isAuthenticated, user, sessionLoading } = useAuthStore()

  if (sessionLoading) {
    return <Loading fullScreen message="Loading…" />
  }

  if (isAuthenticated && user) {
    return <Navigate to={getPostAuthPath(user)} replace />
  }

  return children
}

function App() {
  const { hydrateSession } = useAuthStore()

  useEffect(() => {
    hydrateSession()
  }, [hydrateSession])

  const routes = (
    <>
      <PostAuthRedirect />
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route
          path="/login"
          element={
            <PublicAuthRoute>
              <Login />
            </PublicAuthRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicAuthRoute>
              <Register />
            </PublicAuthRoute>
          }
        />

        <Route
          path="/admin/login"
          element={
            <PublicAuthRoute>
              <AdminLogin />
            </PublicAuthRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AuthGate>
              <AdminArea>
                <AdminLayout />
              </AdminArea>
            </AuthGate>
          }
        >
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />

          <Route path="activity" element={<AdminActivity />} />
          <Route path="feedback" element={<AdminFeedback />} />
        </Route>

        <Route
          path="/app"
          element={
            <AuthGate>
              <UserArea>
                <Layout />
              </UserArea>
            </AuthGate>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="sales" element={<Sales />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="purchase-orders" element={<PurchaseOrders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="credits" element={<Credits />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reinvestments" element={<Reinvestments />} />
          <Route path="outgoing-payments" element={<OutgoingPayments />} />
          <Route path="cash-flow" element={<CashFlowStatement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="projections" element={<Projections />} />
          <Route path="chat" element={<Chat />} />
          <Route path="settings" element={<Settings />} />
          <Route path="billing" element={<Billing />} />
          <Route path="personal" element={<PersonalFinance />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )

  return <Router>{routes}</Router>
}

export default App
