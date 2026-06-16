import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AuthPageLayout from '../../components/auth/AuthPageLayout'
import { AuthFooterLinks, AuthLink } from '../../components/auth/AuthFooter'
import { authAPI } from '../../services/api'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])
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
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setStatus('error')
      setMessage('Please enter all 6 digits of the verification code')
      return
    }

    setStatus('loading')
    setMessage('')
    try {
      await authAPI.verifyEmail(email, fullCode)
      setStatus('success')
      setMessage('Email verified successfully! Redirecting to login...')
      setTimeout(() => navigate(`/login?email=${encodeURIComponent(email)}`), 2000)
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.detail || 'Verification failed. Please try again.')
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await authAPI.resendVerification(email)
      setMessage('Verification code resent! Please check your email.')
      setStatus('idle')
      // Clear and focus first input
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0].focus()
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to resend code')
      setStatus('error')
    } finally {
      setResending(false)
    }
  }

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Only allow digits
    const newCode = [...code]
    newCode[index] = value.slice(-1) // Only take last character
    setCode(newCode)

    // Auto-focus next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus()
    }
  }

  return (
    <AuthPageLayout
      title="Verify Your Email"
      subtitle="We sent a 6-digit verification code to your email"
      footer={
        <AuthFooterLinks secondary={<AuthLink to="/">← Back to home</AuthLink>} />
      }
    >
      <form onSubmit={handleVerify} className="space-y-6">
        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="font-medium">{message}</p>
          </div>
        )}
        
        {status !== 'success' && (
          <>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input bg-gray-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Verification Code</label>
              <div className="flex gap-3 justify-between">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    className="w-full aspect-square text-center text-2xl font-semibold border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    inputMode="numeric"
                    pattern="[0-9]"
                  />
                ))}
              </div>
            </div>

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center text-sm">
                ⚠️ {message}
              </div>
            )}

            {message && status === 'idle' && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-center text-sm">
                ℹ️ {message}
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
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mx-auto"
              >
                {resending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Resending...
                  </>
                ) : (
                  'Resend verification code'
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </AuthPageLayout>
  )
}
