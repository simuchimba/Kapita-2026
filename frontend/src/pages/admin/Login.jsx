import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthPageLayout from '../../components/auth/AuthPageLayout'
import { AuthFooterLinks, AuthLink } from '../../components/auth/AuthFooter'
import { useAuthStore } from '../../store/authStore'
import PasswordInput from '../../components/PasswordInput'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login, logout, loading } = useAuthStore()
  const [formData, setFormData] = useState({ username: '', password: '', rememberMe: true })
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const result = await login(formData)

    if (result.success && result.user?.is_staff) {
      navigate('/admin/overview')
      return
    }

    if (result.success && !result.user?.is_staff) {
      logout()
      setError('Admin access required. Please use an admin account.')
      return
    }

    setError(result.error?.detail || 'Login failed. Check your username/email and password.')
  }

  return (
    <AuthPageLayout
      variant="admin"
      showBadges={false}
      title="Admin sign in"
      subtitle="Manage users, subscriptions, and payment verifications"
      footer={
        <AuthFooterLinks
          primary={
            <p>
              Regular user? <AuthLink to="/login">Go to user login</AuthLink>
            </p>
          }
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div>
          <label className="label">Username or Email</label>
          <input
            type="text"
            required
            className="input"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Password</label>
          <PasswordInput
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={formData.rememberMe}
            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
          />
          <span className="text-sm text-gray-600">Remember me</span>
        </label>
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Signing in...' : 'Sign in as admin'}
        </button>
      </form>
    </AuthPageLayout>
  )
}
