import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignIn } from '@clerk/react'
import AuthPageLayout from '../../components/auth/AuthPageLayout'
import { AuthFooterLinks, AuthLink } from '../../components/auth/AuthFooter'
import { kapitaClerkAppearance } from '../../config/clerkAppearance'
import { useAuthStore } from '../../store/authStore'
import { isClerkEnabled } from '../../config/auth'
import PasswordInput from '../../components/PasswordInput'
import { getPostAuthPath } from '../../utils/postAuthPath'

function LegacyLoginForm({ onSuccess }) {
  const { login, loading } = useAuthStore()
  const [formData, setFormData] = useState({ username: '', password: '' })
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <div>
        <label className="label">Username</label>
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
      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? 'Signing in...' : 'Sign in with password'}
      </button>
    </form>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { logout, isAuthenticated, user } = useAuthStore()
  const [useLegacyLogin, setUseLegacyLogin] = useState(false)

  useEffect(() => {
    if (!isClerkEnabled) {
      logout()
    }
  }, [logout])

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

  if (isClerkEnabled) {
    return (
      <AuthPageLayout
        title="Welcome back"
        subtitle="Sign in to manage sales, expenses, and your business dashboard"
        footer={signUpFooter}
      >
        <div className="auth-notice mb-4 text-left">
          <p className="auth-notice-title">Existing Kapita account?</p>
          <p className="mt-1 text-primary-900/90">
            Sign in with the <strong>same email</strong> you used when you registered — your
            sales, billing, and data will be linked automatically.
          </p>
        </div>

        {!useLegacyLogin ? (
          <>
            <SignIn
              routing="virtual"
              signUpUrl="/register"
              forceRedirectUrl="/app/dashboard"
              appearance={kapitaClerkAppearance}
            />
            <div className="auth-divider">
              <button
                type="button"
                onClick={() => setUseLegacyLogin(true)}
                className="text-sm font-medium text-slate-600 hover:text-primary-700"
              >
                Use username &amp; password instead
              </button>
            </div>
          </>
        ) : (
          <>
            <LegacyLoginForm onSuccess={(u) => navigate(getPostAuthPath(u), { replace: true })} />
            <div className="auth-divider">
              <button
                type="button"
                onClick={() => setUseLegacyLogin(false)}
                className="text-sm font-medium text-slate-600 hover:text-primary-700"
              >
                Back to secure sign-in
              </button>
            </div>
          </>
        )}
      </AuthPageLayout>
    )
  }

  return (
    <AuthPageLayout
      title="Welcome back"
      subtitle="Sign in to manage sales, expenses, and your business dashboard"
      footer={signUpFooter}
    >
      <LegacyLoginForm onSuccess={(u) => navigate(getPostAuthPath(u), { replace: true })} />
    </AuthPageLayout>
  )
}
