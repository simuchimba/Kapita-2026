import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AuthPageLayout from '../../components/auth/AuthPageLayout'
import { AuthFooterLinks, AuthLink } from '../../components/auth/AuthFooter'
import { useAuthStore } from '../../store/authStore'
import PasswordInput from '../../components/PasswordInput'
import { getPostAuthPath } from '../../utils/postAuthPath'

function LoginForm({ onSuccess, prefillUsername }) {
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    username: searchParams.get('email') || '',
    password: '',
    rememberMe: true,
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(formData)
    if (result.success) {
      onSuccess(result.user)
    } else {
      const detail = result.error?.detail
      setError(typeof detail === 'string' ? detail : 'Invalid credentials')
    }
  }

  return (
    <div className="space-y-5">
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
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getPostAuthPath(user), { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const signUpFooter = (
    <AuthFooterLinks
      primary={
        <p>
          Don&apos;t have an account? <AuthLink to="/register">Sign up free</AuthLink>
        </p>
      }
      secondary={<AuthLink to="/">← Back to home</AuthLink>}
    />
  )

  return (
    <AuthPageLayout
      title="Welcome back"
      subtitle="Sign in to manage sales, expenses, and your business dashboard"
      footer={signUpFooter}
    >
      <LoginForm onSuccess={(u) => navigate(getPostAuthPath(u), { replace: true })} />
    </AuthPageLayout>
  )
}
