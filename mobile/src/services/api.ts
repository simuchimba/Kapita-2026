import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access, refresh: newRefresh } = response.data;
          await saveToken(access);
          if (newRefresh) {
            await saveRefreshToken(newRefresh);
          }
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Token storage helpers - using SecureStore for sensitive data
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const saveToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to save token securely:', error);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get token securely:', error);
    return null;
  }
};

export const saveRefreshToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to save refresh token securely:', error);
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get refresh token securely:', error);
    return null;
  }
};

export const clearTokens = async () => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear tokens securely:', error);
  }
};

// Auth API
export const authAPI = {
  login: async (usernameOrEmail: string, password: string) => {
    const response = await api.post('/auth/login/', {
      username_or_email: usernameOrEmail,
      password,
    });
    const { access, refresh } = response.data;
    await saveToken(access);
    await saveRefreshToken(refresh);
    return response.data;
  },
  
  register: async (
    username: string,
    email: string,
    password: string,
    password2: string,
    first_name: string,
    last_name: string,
    phone: string,
    business_name: string,
  ) => {
    const response = await api.post('/auth/register/', {
      username,
      email,
      password,
      password2,
      first_name,
      last_name,
      phone,
      business_name,
    });
    return response.data;
  },
  
  logout: async () => {
    await clearTokens();
  },
  
  getUserInfo: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  changePassword: async (data: any) => {
    const response = await api.post('/auth/change-password/', data);
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/auth/profile/', data);
    return response.data;
  },
};

// Products API
export const productsAPI = {
  list: async () => {
    const response = await api.get('/products/');
    return response.data.results ?? response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/products/', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/products/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/products/${id}/`);
    return response.data;
  },
};

// Sales API
export const salesAPI = {
  list: async () => {
    const response = await api.get('/sales/');
    return response.data.results ?? response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/sales/', data);
    return response.data;
  },
  
  getSummary: async () => {
    const response = await api.get('/sales/summary/');
    return response.data;
  },
};

// Customers API
export const customersAPI = {
  list: async () => {
    const response = await api.get('/customers/');
    return response.data.results ?? response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/customers/', data);
    return response.data;
  },
};

// Credits API
export const creditsAPI = {
  list: async () => {
    const response = await api.get('/credits/');
    return response.data.results ?? response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/credits/', data);
    return response.data;
  },
  
  recordPayment: async (id: number, data: any) => {
    const response = await api.post(`/credits/${id}/record_payment/`, data);
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/credits/summary/');
    return response.data;
  },
};

// Expenses API
export const expensesAPI = {
  list: async () => {
    const response = await api.get('/expenses/');
    return response.data.results ?? response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/expenses/', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/expenses/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/expenses/${id}/`);
    return response.data;
  },

  getSummary: async (params?: any) => {
    const response = await api.get('/expenses/summary/', { params });
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/expenses/categories/');
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard/');
    return response.data;
  },
  
  getCapital: async () => {
    const response = await api.get('/analytics/capital/');
    return response.data;
  },
  
  getCashflow: async (params?: any) => {
    const response = await api.get('/analytics/cashflow/', { params });
    return response.data;
  },

  getReports: async (params?: any) => {
    const response = await api.get('/analytics/reports/', { params });
    return response.data;
  },

  getProjections: async (params?: any) => {
    const response = await api.get('/analytics/projections/', { params });
    return response.data;
  },

  getMonthly: async (params?: any) => {
    const response = await api.get('/analytics/monthly/', { params });
    return response.data;
  },

  getComprehensiveReport: async (params?: any) => {
    const response = await api.get('/analytics/comprehensive-report/', { params });
    return response.data;
  },

  getCashFlowStatement: async (params?: any) => {
    const response = await api.get('/analytics/cash-flow-statement/', { params });
    return response.data;
  },
};

// Reinvestments API
export const reinvestmentsAPI = {
  list: async () => {
    const response = await api.get('/reinvestments/');
    return response.data.results ?? response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/reinvestments/', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/reinvestments/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/reinvestments/${id}/`);
    return response.data;
  },

  getSummary: async (params?: any) => {
    const response = await api.get('/reinvestments/summary/', { params });
    return response.data;
  },

  getPurposes: async () => {
    const response = await api.get('/reinvestments/purposes/');
    return response.data;
  },
};

// Suppliers API
export const suppliersAPI = {
  list: async () => {
    const response = await api.get('/suppliers/');
    return response.data.results ?? response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/suppliers/', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/suppliers/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/suppliers/${id}/`);
    return response.data;
  },
};

// Purchase Orders API
export const purchaseOrdersAPI = {
  list: async () => {
    const response = await api.get('/purchase-orders/');
    return response.data.results ?? response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/purchase-orders/', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/purchase-orders/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/purchase-orders/${id}/`);
    return response.data;
  },

  receive: async (id: number) => {
    const response = await api.post(`/purchase-orders/${id}/receive/`);
    return response.data;
  },
};

// Quotations API
export const quotationsAPI = {
  list: async () => {
    const response = await api.get('/quotations/');
    return response.data.results ?? response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/quotations/', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/quotations/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/quotations/${id}/`);
    return response.data;
  },
};

// Promotions API
export const promotionsAPI = {
  list: async () => {
    const response = await api.get('/promotions/');
    return response.data.results ?? response.data;
  },

  getActive: async () => {
    const response = await api.get('/promotions/active/');
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/promotions/', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/promotions/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/promotions/${id}/`);
    return response.data;
  },

  toggleStatus: async (id: number) => {
    const response = await api.post(`/promotions/${id}/toggle_status/`);
    return response.data;
  },
};

// Outgoing Payments API
export const outgoingPaymentsAPI = {
  list: async () => {
    const response = await api.get('/outgoing-payments/');
    return response.data.results ?? response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/outgoing-payments/', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/outgoing-payments/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/outgoing-payments/${id}/`);
    return response.data;
  },
};

// Billing API
export const billingAPI = {
  getMyStatus: async () => {
    const response = await api.get('/billing/me/');
    return response.data;
  },

  submitPaymentProof: async (formData: any) => {
    const response = await api.post('/billing/submit-proof/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/billing/history/');
    return response.data;
  },

  getAdminOverview: async () => {
    const response = await api.get('/billing/admin/overview/');
    return response.data;
  },

  getAdminUsers: async (params?: any) => {
    const response = await api.get('/billing/admin/users/', { params });
    return response.data;
  },

  deleteUser: async (userId: number) => {
    const response = await api.delete(`/billing/admin/users/${userId}/delete/`);
    return response.data;
  },

  getAdminPayments: async (params?: any) => {
    const response = await api.get('/billing/admin/payments/', { params });
    return response.data;
  },

  approvePayment: async (paymentId: number, data?: any) => {
    const response = await api.post(`/billing/admin/payments/${paymentId}/approve/`, data);
    return response.data;
  },

  rejectPayment: async (paymentId: number, data?: any) => {
    const response = await api.post(`/billing/admin/payments/${paymentId}/reject/`, data);
    return response.data;
  },

  getSubscriptionHistory: async (userId: number) => {
    const response = await api.get(`/billing/admin/subscriptions/${userId}/history/`);
    return response.data;
  },

  extendSubscription: async (userId: number, data: any) => {
    const response = await api.post(`/billing/admin/subscriptions/${userId}/extend/`, data);
    return response.data;
  },

  revokeSubscription: async (userId: number) => {
    const response = await api.post(`/billing/admin/subscriptions/${userId}/revoke/`);
    return response.data;
  },

  getActivityLogs: async () => {
    const response = await api.get('/billing/admin/activity/');
    return response.data;
  },

  getAdminPurchaseOrders: async (params?: any) => {
    const response = await api.get('/billing/admin/purchase-orders/', { params });
    return response.data;
  },

  getAdminSuppliers: async (params?: any) => {
    const response = await api.get('/billing/admin/suppliers/', { params });
    return response.data;
  },
};

// Feedback API
export const feedbackAPI = {
  submit: async (data: { category: string; rating: number | null; title: string; message: string; page: string }) => {
    const response = await api.post('/feedback/', data);
    return response.data;
  },

  getMine: async () => {
    const response = await api.get('/feedback/mine/');
    return response.data.results ?? response.data;
  },

  getAll: async (params?: any) => {
    const response = await api.get('/feedback/admin/', { params });
    return response.data.results ?? response.data;
  },

  getStats: async () => {
    const response = await api.get('/feedback/admin/stats/');
    return response.data;
  },

  updateStatus: async (id: number, data: { status?: string; admin_notes?: string }) => {
    const response = await api.patch(`/feedback/admin/${id}/`, data);
    return response.data;
  },

  deleteFeedback: async (id: number) => {
    const response = await api.delete(`/feedback/admin/${id}/`);
    return response.data;
  },
};

// Personal Finance API
export const personalFinanceAPI = {
  getTransactions: async (params?: any) => {
    const response = await api.get('/personal/transactions/', { params });
    return response.data.results ?? response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/personal/transactions/', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/personal/transactions/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/personal/transactions/${id}/`);
    return response.data;
  },

  getSummary: async (params?: any) => {
    const response = await api.get('/personal/transactions/summary/', { params });
    return response.data;
  },

  getDashboard: async (params?: any) => {
    const response = await api.get('/personal/transactions/dashboard/', { params });
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/personal/transactions/categories/');
    return response.data;
  },

  getTypes: async () => {
    const response = await api.get('/personal/transactions/types/');
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  sendMessage: async (message: string, messages: any[] = []) => {
    const response = await api.post('/chat/', { message, messages });
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async () => {
    const response = await api.get('/notifications/');
    return response.data.results ?? response.data;
  },

  getUnread: async () => {
    const response = await api.get('/notifications/unread/');
    return response.data;
  },

  markRead: async (id: number) => {
    const response = await api.patch(`/notifications/${id}/mark_read/`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.post('/notifications/mark_all_read/');
    return response.data;
  },
};

// Invoices API
export const invoicesAPI = {
  list: async (params?: any) => {
    const response = await api.get('/invoices/', { params });
    return response.data.results ?? response.data;
  },

  getOne: async (id: number) => {
    const response = await api.get(`/invoices/${id}/`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/invoices/', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/invoices/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/invoices/${id}/`);
    return response.data;
  },

  markPaid: async (id: number, data?: any) => {
    const response = await api.post(`/invoices/${id}/mark_paid/`, data);
    return response.data;
  },

  send: async (id: number) => {
    const response = await api.post(`/invoices/${id}/send/`);
    return response.data;
  },
};

// Currencies API
export const currenciesAPI = {
  list: async () => {
    const response = await api.get('/currencies/');
    return response.data.results ?? response.data;
  },

  getRates: async () => {
    const response = await api.get('/currencies/rates/');
    return response.data.results ?? response.data;
  },

  createRate: async (data: any) => {
    const response = await api.post('/currencies/rates/', data);
    return response.data;
  },

  deleteRate: async (id: number) => {
    const response = await api.delete(`/currencies/rates/${id}/`);
    return response.data;
  },

  convert: async (params: any) => {
    const response = await api.get('/currencies/rates/convert/', { params });
    return response.data;
  },
};

// Backup API
export const backupAPI = {
  exportBackup: async () => {
    const response = await api.get('/backup/export/', { responseType: 'arraybuffer' });
    return response.data;
  },

  restoreBackup: async (formData: FormData) => {
    const response = await api.post('/backup/restore/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default api;
