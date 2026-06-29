import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { billingAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import {
  Activity,
  BadgeCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquarePlus,
  UploadCloud,
  Users,
  X,
} from 'lucide-react'

const navItems = [
  { name: 'Overview', href: '/admin/overview', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Payments', href: '/admin/payments', icon: UploadCloud },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: BadgeCheck },
  { name: 'Activity', href: '/admin/activity', icon: Activity },
  { name: 'Feedback', href: '/admin/feedback', icon: MessageSquarePlus },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    billingAPI.getAdminOverview()
      .then((res) => setPendingCount(res.data?.pending_payment_verifications ?? 0))
      .catch(() => setPendingCount(0))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
            <Link to="/admin/overview" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
              <img 
                src="/logo1.png" 
                alt="Kapita Logo" 
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextElementSibling.style.display = 'flex'
                }}
              />
              <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-xl">
                K
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Kapita Admin</p>
                <p className="text-xs text-gray-500">Control panel</p>
              </div>
            </Link>
            <button type="button" className="lg:hidden text-gray-500" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {item.href === '/admin/payments' && pendingCount > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          <div className="border-t border-gray-200 p-4">
            <div className="mb-3 rounded-xl bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-900">{user?.username}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button type="button" onClick={handleLogout} className="btn btn-secondary w-full inline-flex items-center justify-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button type="button" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block">

          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800">
              Admin
            </span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
