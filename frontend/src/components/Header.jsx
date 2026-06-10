import { Menu, Bell, LogOut, ShieldCheck } from 'lucide-react'
import { UserButton } from '@clerk/react'
import { useAuthStore } from '../store/authStore'
import { useState, useEffect } from 'react'
import { notificationsAPI } from '../services/api'
import { isClerkEnabled } from '../config/auth'

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)

  const billingLocked =
    user?.access_status === 'expired' ||
    user?.access_status === 'pending_payment_verification'

  useEffect(() => {
    if (billingLocked) return
    fetchUnreadCount()
  }, [billingLocked])

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount()
      setUnreadCount(response.data.count)
    } catch (error) {
      // Ignore when subscription-gated APIs are unavailable
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {user?.business_name || 'Kapita'}
            </h1>
            <p className="text-xs text-gray-500">
              Welcome back, {user?.first_name || user?.username}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {user?.access_status && !user?.is_staff && (
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{user.access_status.replace(/_/g, ' ')}</span>
            </div>
          )}

          <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {isClerkEnabled ? (
            <UserButton afterSignOutUrl="/login" />
          ) : (
            <button
              onClick={() => logout()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
