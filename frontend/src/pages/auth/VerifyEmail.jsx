import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AuthPageLayout from '../../components/auth/AuthPageLayout'
import { AuthFooterLinks, AuthLink } from '../../components/auth/AuthFooter'
import { authAPI } from '../../services/api'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleVerify = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      await authAPI.verifyEmail(email, code)
      setStatus('success')
      setMessage('Email verified successfully! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.detail || 'Verification failed')
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await authAPI.resendVerification(email)
      setMessage('Verification code resent! Please check your email.')
      setStatus('idle')
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthPageLayout
      title="Verify Your Email"
      subtitle="Enter the 6-digit code sent to your email"
      footer={
        <AuthFooterLinks secondary={<AuthLink to="/">← Back to home</AuthLink>} />
      }
    >
      <form onSubmit={handleVerify} className="space-y-5">
        {status === 'success' && (
          <div className="text-green-600 font-medium text-center">{message}</div>
        )}
        
        {status !== 'success' && (
          <>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Verification Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit code"
                className="input text-center text-2xl tracking-widest"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                required
              />
            </div>

            {status === 'error' && (
              <div className="text-red-600 text-sm text-center">{message}</div>
            )}

            {message && status === 'idle' && (
              <div className="text-green-600 text-sm text-center">{message}</div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn btn-primary w-full"
            >
              {status === 'loading' ? 'Verifying...' : 'Verify Email'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {resending ? 'Resending...' : 'Resend verification code'}
              </button>
            </div>
          </>
        )}
      </form>
    </AuthPageLayout>
  )
}
