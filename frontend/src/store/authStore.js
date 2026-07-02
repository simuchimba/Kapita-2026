import { create } from 'zustand'
import { authAPI } from '../services/api'
import { getToken, setToken, clearTokens, setRememberMe } from '../services/tokenStorage'

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  sessionLoading: !!getToken('access_token'),
  error: null,

  login: async (credentials) => {
        clearTokens()

        if (!navigator.onLine) {
          set({ error: 'No internet connection. Please go online to log in.', loading: false })
          return { success: false, error: { detail: 'No internet connection' } }
        }

        setRememberMe(!!credentials.rememberMe)
        set({ loading: true, error: null })
        try {
            const response = await authAPI.login({
                username_or_email: credentials.username,
                password: credentials.password,
            })
            const { access, refresh } = response.data

            setToken('access_token', access)
            setToken('refresh_token', refresh)

            const profileResponse = await authAPI.getProfile()
            set({
                user: profileResponse.data,
                isAuthenticated: true,
                loading: false,
                sessionLoading: false,
                error: null,
            })

            return { success: true, user: profileResponse.data }
        } catch (error) {
            const message =
                error.response?.data?.detail ||
                (error.response?.data?.offline
                    ? 'No internet connection. Please go online and try again.'
                    : (!navigator.onLine
                        ? 'No internet connection. Please go online to log in.'
                        : (error.request && !error.response
                            ? 'Cannot reach the Kapita server. Please check your internet connection.'
                            : 'Login failed. Check your username/email and password.')))

            clearTokens()
            set({
                error: message,
                loading: false,
                isAuthenticated: false,
            })
            return { success: false, error: error.response?.data || { detail: message } }
        }
    },

  register: async (userData) => {
    set({ loading: true, error: null })
    try {
      const response = await authAPI.register(userData)
      set({ loading: false })
      return { success: true, email: response.data.email }
    } catch (error) {
      set({
        error: error.response?.data || 'Registration failed',
        loading: false,
      })
      return { success: false, error: error.response?.data }
    }
  },

  logout: async () => {
    clearTokens()
    set({ user: null, isAuthenticated: false, sessionLoading: false, error: null })
  },

  hydrateSession: async () => {
    const token = getToken('access_token')

    if (!token) {
      set({ user: null, isAuthenticated: false, sessionLoading: false, error: null })
      return { success: false }
    }

    set({ sessionLoading: true, error: null })

    try {
      const response = await authAPI.getProfile()
      set({
        user: response.data,
        isAuthenticated: true,
        sessionLoading: false,
        error: null,
      })
      return { success: true, user: response.data }
    } catch (error) {
      const isNetworkError = !error.response && error.request
      const isAuthError = error.response?.status === 401 ||
        (typeof error.response?.data?.detail === 'string' &&
          (error.response.data.detail.toLowerCase().includes('token_not_valid') ||
           error.response.data.detail.toLowerCase().includes('given token not valid')))

      if (isNetworkError) {
        set({ sessionLoading: false })
        return { success: false, offline: true }
      }

      if (!isAuthError) {
        set({ sessionLoading: false })
        return { success: false }
      }

      const refreshToken = getToken('refresh_token')

      try {
        if (!refreshToken) throw error

        const refreshResponse = await authAPI.refreshToken(refreshToken)
        const { access } = refreshResponse.data
        setToken('access_token', access)

        const profileResponse = await authAPI.getProfile()
        set({
          user: profileResponse.data,
          isAuthenticated: true,
          sessionLoading: false,
          error: null,
        })
        return { success: true, user: profileResponse.data }
      } catch (_) {
        const isRefreshNetworkError = !_.response && _.request
        if (isRefreshNetworkError) {
          set({ sessionLoading: false })
          return { success: false, offline: true }
        }
        clearTokens()
        set({ user: null, isAuthenticated: false, sessionLoading: false, error: null })
        return { success: false }
      }
    }
  },

  fetchUser: async () => {
    try {
      const response = await authAPI.getProfile()
      set({ user: response.data })
      return response.data
    } catch (error) {
      console.error('Failed to fetch user:', error)
      return null
    }
  },

  refreshUser: async () => {
    return get().fetchUser()
  },

  updateProfile: async (data) => {
    try {
      const response = await authAPI.updateProfile(data)
      set({ user: response.data })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data }
    }
  },
}))
