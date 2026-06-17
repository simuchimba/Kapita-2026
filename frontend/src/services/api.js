import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_URL =
  import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

async function resolveAuthToken() {
  const token = localStorage.getItem('access_token')
  if (token) {
    return token
  }
  return null
}

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await resolveAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const detail = error.response?.data?.detail
    const subscriptionBlocked =
      typeof detail === 'string' &&
      detail.toLowerCase().includes('trial or subscription')
    const isTokenError =
      typeof detail === 'string' &&
      (detail.toLowerCase().includes('token_not_valid') ||
        detail.toLowerCase().includes('given token not valid'))

    // If it's a token error, clear storage and redirect
    if (isTokenError) {
      useAuthStore.getState().logout()
      const isAdminPath = window.location.pathname.startsWith('/admin')
      window.location.href = isAdminPath ? '/admin/login' : '/login'
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && subscriptionBlocked) {
      if (!window.location.pathname.startsWith('/app/billing')) {
        window.location.href = '/app/billing'
      }
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) throw new Error('No refresh token')

        const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        })

        const { access } = response.data
        localStorage.setItem('access_token', access)

        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout()
        const isAdminPath = window.location.pathname.startsWith('/admin')
        window.location.href = isAdminPath ? '/admin/login' : '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  refreshToken: (refresh) => axios.post(`${API_URL}/auth/token/refresh/`, { refresh }),
  getProfile: (config) => api.get('/auth/me/', config),
  getReceiptSettings: () => api.get('/auth/receipt-settings/'),
  updateReceiptSettings: (data) => api.put('/auth/receipt-settings/', data),
  updateProfile: (data) => api.put('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  verifyEmail: (email, code) => api.post('/auth/verify-email/', { email, code }),
  resendVerification: (email) => api.post('/auth/resend-verification/', { email }),
  requestPasswordReset: (email) => api.post('/auth/password-reset/request/', { email }),
  confirmPasswordReset: (email, code, newPassword) => api.post('/auth/password-reset/confirm/', { email, code, new_password: newPassword }),
  sendTestEmail: () => api.post('/auth/send-test-email/'),
}

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products/', { params }),
  getOne: (id) => api.get(`/products/${id}/`),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.put(`/products/${id}/`, data),
  delete: (id) => api.delete(`/products/${id}/`),
  restock: (id, data) => api.post(`/products/${id}/restock/`, data),
  getLowStock: () => api.get('/products/low_stock/'),
  getCategories: () => api.get('/products/categories/'),
  getSummary: () => api.get('/products/inventory_summary/'),
}

// Sales API
export const salesAPI = {
  getAll: (params) => api.get('/sales/', { params }),
  getOne: (id) => api.get(`/sales/${id}/`),
  create: (data) => api.post('/sales/', data),
  getSummary: (params) => api.get('/sales/summary/', { params }),
  getDailySales: () => api.get('/sales/daily_sales/'),
  getTopProducts: (params = {}) => {
    const limit = typeof params === 'number' ? params : (params.limit || 10);
    return api.get('/sales/top_products/', { params: { limit } });
  },
  getRecent: (limit = 10) => api.get('/sales/recent/', { params: { limit } }),
  getReceipt: (id) => api.get(`/sales/${id}/receipt/`, { responseType: 'blob' }),
}

// Customers API
export const customersAPI = {
  getAll: (params) => api.get('/customers/', { params }),
  getOne: (id) => api.get(`/customers/${id}/`),
  create: (data) => api.post('/customers/', data),
  update: (id, data) => api.put(`/customers/${id}/`, data),
  delete: (id) => api.delete(`/customers/${id}/`),
  getPurchaseHistory: (id) => api.get(`/customers/${id}/purchase_history/`),
  getCreditHistory: (id) => api.get(`/customers/${id}/credit_history/`),
  getWithDebt: () => api.get('/customers/with_debt/'),
}

// Credits API
export const creditsAPI = {
  getAll: (params) => api.get('/credits/', { params }),
  getOne: (id) => api.get(`/credits/${id}/`),
  create: (data) => api.post('/credits/', data),
  update: (id, data) => api.put(`/credits/${id}/`, data),
  recordPayment: (id, data) => api.post(`/credits/${id}/record_payment/`, data),
  getOverdue: () => api.get('/credits/overdue/'),
  getPending: () => api.get('/credits/pending/'),
  getSummary: () => api.get('/credits/summary/'),
  getPaymentHistory: (id) => api.get(`/credits/${id}/payment_history/`),
}

// Expenses API
export const expensesAPI = {
  getAll: (params) => api.get('/expenses/', { params }),
  getOne: (id) => api.get(`/expenses/${id}/`),
  create: (data) => api.post('/expenses/', data),
  update: (id, data) => api.put(`/expenses/${id}/`, data),
  delete: (id) => api.delete(`/expenses/${id}/`),
  getSummary: (params) => api.get('/expenses/summary/', { params }),
  getByCategory: () => api.get('/expenses/by_category/'),
  getMonthlyTrend: () => api.get('/expenses/monthly_trend/'),
  getCategories: () => api.get('/expenses/categories/'),
}

// Reinvestments API
export const reinvestmentsAPI = {
  getAll: (params) => api.get('/reinvestments/', { params }),
  getOne: (id) => api.get(`/reinvestments/${id}/`),
  create: (data) => api.post('/reinvestments/', data),
  update: (id, data) => api.put(`/reinvestments/${id}/`, data),
  delete: (id) => api.delete(`/reinvestments/${id}/`),
  getSummary: (params) => api.get('/reinvestments/summary/', { params }),
  getByPurpose: () => api.get('/reinvestments/by_purpose/'),
  getPurposes: () => api.get('/reinvestments/purposes/'),
}

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard/'),
  getCapital: () => api.get('/analytics/capital/'),
  getCashflow: (params) => api.get('/analytics/cashflow/', { params }),
  getReports: (params) => api.get('/analytics/reports/', { params }),
  getProjections: (params) => api.get('/analytics/projections/', { params }),
  getMonthly: (params) => api.get('/analytics/monthly/', { params }),
  getComprehensiveReport: (params) => api.get('/analytics/comprehensive-report/', { params }),
  getCashFlowStatement: (params) => api.get('/analytics/cash-flow-statement/', { params }),
  getCashFlowStatementPDF: (params) => api.get('/analytics/cash-flow-statement/pdf/', { params, responseType: 'blob' }),
}

// Outgoing Payments API
export const outgoingPaymentsAPI = {
  getAll: (params) => api.get('/outgoing-payments/', { params }),
  getOne: (id) => api.get(`/outgoing-payments/${id}/`),
  create: (data) => api.post('/outgoing-payments/', data),
  update: (id, data) => api.put(`/outgoing-payments/${id}/`, data),
  delete: (id) => api.delete(`/outgoing-payments/${id}/`),
  getReceipt: (id) => api.get(`/outgoing-payments/${id}/receipt/`, { responseType: 'blob' }),
}

// Billing + subscription APIs
export const billingAPI = {
  getMyStatus: () => api.get('/billing/me/'),
  submitPaymentProof: (formData) => api.post('/billing/submit-proof/', formData),
  getHistory: () => api.get('/billing/history/'),
  getAdminOverview: () => api.get('/billing/admin/overview/'),
  getAdminUsers: (params) => api.get('/billing/admin/users/', { params }),
  exportAdminUsersCsv: (params) => api.get('/billing/admin/users/', { params: { ...params, export: 'csv' }, responseType: 'blob' }),
  deleteUser: (userId) => api.delete(`/billing/admin/users/${userId}/delete/`),
  getAdminPayments: (params) => api.get('/billing/admin/payments/', { params }),
  approvePayment: (paymentId, data) => api.post(`/billing/admin/payments/${paymentId}/approve/`, data),
  rejectPayment: (paymentId, data) => api.post(`/billing/admin/payments/${paymentId}/reject/`, data),
  getSubscriptionHistory: (userId) => api.get(`/billing/admin/subscriptions/${userId}/history/`),
  extendSubscription: (userId, data) => api.post(`/billing/admin/subscriptions/${userId}/extend/`, data),
  revokeSubscription: (userId) => api.post(`/billing/admin/subscriptions/${userId}/revoke/`),
  getActivityLogs: () => api.get('/billing/admin/activity/'),
}

// Personal Finance API (separate from business)
export const personalFinanceAPI = {
  getTransactions: (params) => api.get('/personal/transactions/', { params }),
  getOne: (id) => api.get(`/personal/transactions/${id}/`),
  create: (data) => api.post('/personal/transactions/', data),
  update: (id, data) => api.put(`/personal/transactions/${id}/`, data),
  delete: (id) => api.delete(`/personal/transactions/${id}/`),
  getSummary: (params) => api.get('/personal/transactions/summary/', { params }),
  getDashboard: (params) => api.get('/personal/transactions/dashboard/', { params }),
  getCategories: () => api.get('/personal/transactions/categories/'),
  getTypes: () => api.get('/personal/transactions/types/'),
}

// AI proxy API (server-side) — frontend should never include the key
export const aiAPI = {
  query: (payload) => api.post('/analytics/ai-query/', payload),
}

// Chat API
export const chatAPI = {
  sendMessage: (message, messages = []) => api.post('/chat/', { message, messages }),
  streamMessage: (message, messages = []) => api.post('/chat/stream/', { message, messages }, { responseType: 'stream' }),
  textToSpeech: (text) => api.post('/chat/tts/', { text }, { responseType: 'blob' }),
  speechToText: (audioBlob) => {
    const formData = new FormData()
    formData.append('audio', audioBlob)
    return api.post('/chat/stt/', formData)
  },
}

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications/'),
  getUnread: () => api.get('/notifications/unread/'),
  getUnreadCount: () => api.get('/notifications/unread_count/'),
  markRead: (id) => api.patch(`/notifications/${id}/mark_read/`),
  markAllRead: () => api.post('/notifications/mark_all_read/'),
  delete: (id) => api.delete(`/notifications/${id}/`),
}

// Promotions API
export const promotionsAPI = {
  getAll: (params) => api.get('/promotions/', { params }),
  getActive: () => api.get('/promotions/active/'),
  getForProduct: (productId) => api.get('/promotions/for_product/', { params: { product_id: productId } }),
  getOne: (id) => api.get(`/promotions/${id}/`),
  create: (data) => api.post('/promotions/', data),
  update: (id, data) => api.put(`/promotions/${id}/`, data),
  delete: (id) => api.delete(`/promotions/${id}/`),
  toggleStatus: (id) => api.post(`/promotions/${id}/toggle_status/`),
  calculateDiscount: (data) => api.post('/promotions/calculate_discount/', data),
}

// Suppliers API
export const suppliersAPI = {
  getAll: (params) => api.get('/suppliers/', { params }),
  getOne: (id) => api.get(`/suppliers/${id}/`),
  create: (data) => api.post('/suppliers/', data),
  update: (id, data) => api.put(`/suppliers/${id}/`, data),
  delete: (id) => api.delete(`/suppliers/${id}/`),
}

// Purchase Orders API
export const purchaseOrdersAPI = {
  getAll: (params) => api.get('/purchase-orders/', { params }),
  getOne: (id) => api.get(`/purchase-orders/${id}/`),
  create: (data) => api.post('/purchase-orders/', data),
  update: (id, data) => api.put(`/purchase-orders/${id}/`, data),
  delete: (id) => api.delete(`/purchase-orders/${id}/`),
  receive: (id) => api.post(`/purchase-orders/${id}/receive/`),
}

// Quotations API
export const quotationsAPI = {
  getAll: (params) => api.get('/quotations/', { params }),
  getOne: (id) => api.get(`/quotations/${id}/`),
  create: (data) => api.post('/quotations/', data),
  update: (id, data) => api.put(`/quotations/${id}/`, data),
  delete: (id) => api.delete(`/quotations/${id}/`),
  getPDF: (id) => api.get(`/quotations/${id}/pdf/`, { responseType: 'blob' }),
}

export default api
