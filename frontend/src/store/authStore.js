import { create } from 'zustand'
import { authAPI } from '../services/api'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function profileErrorMessage(error) {
  if (error.response?.data?.detail) {
    return typeof error.response.data.detail === 'string'
      ? error.response.data.detail
      : 'Could not load your Kapita profile.'
  }
  if (error.request && !error.response) {
    return 'Cannot reach the Kapita server. Make sure the backend is running on port 8000.'
  }
  return 'Could not load your Kapita profile. Please try again.'
}

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  sessionLoading: !!localStorage.getItem('access_token'),
  error: null,

  login: async (credentials) => {
    // Clear any old tokens first
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    set({ loading: true, error: null })
    try {
      const response = await authAPI.login(credentials)
      const { access, refresh } = response.data

      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)

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
        (error.request && !error.response
          ? 'Cannot reach the server. Make sure the backend is running on port 8000.'
          : 'Login failed. Check your username and password.')

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
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false, sessionLoading: false, error: null })
  },

  hydrateSession: async () => {
    const token = localStorage.getItem('access_token')

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
      const refreshToken = localStorage.getItem('refresh_token')

      try {
        if (!refreshToken) throw error

        const refreshResponse = await authAPI.refreshToken(refreshToken)
        const { access } = refreshResponse.data
        localStorage.setItem('access_token', access)

        const profileResponse = await authAPI.getProfile()
        set({
          user: profileResponse.data,
          isAuthenticated: true,
          sessionLoading: false,
          error: null,
        })
        return { success: true, user: profileResponse.data }
      } catch (_) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
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
