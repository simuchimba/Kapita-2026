import { useEffect, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import AuthPageLayout from '../../components/auth/AuthPageLayout'
import { AuthFooterLinks, AuthLink } from '../../components/auth/AuthFooter'
import { useAuthStore } from '../../store/authStore'
import PasswordInput from '../../components/PasswordInput'
import { getPostAuthPath } from '../../utils/postAuthPath'
import { authAPI } from '../../services/api'

function LoginForm({ onSuccess, prefillUsername }) {
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({ username: searchParams.get('email') || '', password: '' })
  const [error, setError] = useState('')
  const [showResend, setShowResend] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [resendMessage, setResendMessage] = useState('')
  const [resendError, setResendError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setShowResend(false)
    const result = await login(formData)
    if (result.success) {
      onSuccess(result.user)
    } else if (result.emailNotVerified) {
      navigate(`/verify-email?email=${encodeURIComponent(result.email)}`)
    } else {
      const detail = result.error?.detail
      setError(typeof detail === 'string' ? detail : 'Invalid credentials')
      setShowResend(true)
      setResendEmail(formData.username.includes('@') ? formData.username : '')
    }
  }

  const handleResend = async (e) => {
    e.preventDefault()
    setResendMessage('')
    setResendError('')
    try {
      await authAPI.resendVerification(resendEmail)
      setResendMessage('Verification email sent!')
    } catch (err) {
      setResendError(err.response?.data?.detail || 'Failed to send verification email')
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
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {showResend && (
        <div className="border-t pt-4 mt-4">
          <p className="text-sm text-gray-600 mb-3">
            Haven't verified your email yet?
          </p>
          <form onSubmit={handleResend} className="space-y-3">
            <div>
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="input"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
              />
            </div>
            {resendMessage && (
              <p className="text-sm text-green-600">{resendMessage}</p>
            )}
            {resendError && (
              <p className="text-sm text-red-600">{resendError}</p>
            )}
            <button type="submit" className="btn btn-secondary w-full">
              Resend Verification Email
            </button>
          </form>
        </div>
      )}
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
