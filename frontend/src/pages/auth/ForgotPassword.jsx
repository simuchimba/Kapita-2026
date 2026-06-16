import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthPageLayout from '../../components/auth/AuthPageLayout'
import { AuthFooterLinks, AuthLink } from '../../components/auth/AuthFooter'
import { authAPI } from '../../services/api'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [message, setMessage] = useState('')

  const handleRequestReset = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      await authAPI.requestPasswordReset(email)
      setStatus('success')
      setMessage('If an account exists with this email, we have sent a password reset code. Please check your email.')
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.detail || 'Failed to send reset code. Please try again.')
    }
  }

  return (
    <AuthPageLayout
      title="Reset Your Password"
      subtitle="Enter your email address and we'll send you a password reset code"
      footer={
        <AuthFooterLinks
          primary={
            <p>
              Remember your password? <AuthLink to="/login">Sign in</AuthLink>
            </p>
          }
          secondary={<AuthLink to="/">← Back to home</AuthLink>}
        />
      }
    >
      {status === 'success' ? (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="font-medium">{message}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/reset-password', { state: { email } })}
            className="btn btn-primary w-full"
          >
            Enter Reset Code
          </button>
        </div>
      ) : (
        <form onSubmit={handleRequestReset} className="space-y-5">
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center text-sm">
              ⚠️ {message}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Code'
            )}
          </button>
        </form>
      )}
    </AuthPageLayout>
  )
}
