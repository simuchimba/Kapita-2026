import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthPageLayout from '../../components/auth/AuthPageLayout'
import { AuthFooterLinks, AuthLink } from '../../components/auth/AuthFooter'
import { useAuthStore } from '../../store/authStore'
import PasswordInput from '../../components/PasswordInput'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login, logout, loading } = useAuthStore()
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const result = await login(formData)

    if (!result.success) {
      // Wrong credentials — show the actual server error
      setError(result.error?.detail || 'Invalid username or password.')
      return
    }

    if (!result.user?.is_staff) {
      // Logged in but not an admin — clear the session and tell them
      await logout()
      setError('This account does not have admin access. Use the regular login instead.')
      return
    }

    navigate('/admin/overview')
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
            placeholder="admin"
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

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Signing in...' : 'Sign in as admin'}
        </button>
      </form>
    </AuthPageLayout>
  )
}
