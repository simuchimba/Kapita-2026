import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthPageLayout from '../../components/auth/AuthPageLayout'
import { AuthFooterLinks, AuthLink } from '../../components/auth/AuthFooter'
import PasswordInput from '../../components/PasswordInput'
import { authAPI } from '../../services/api'

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const inputRefs = useRef([])
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [message, setMessage] = useState('')

  const handleResetPassword = async (e) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setStatus('error')
      setMessage('Please enter all 6 digits of the reset code')
      return
    }
    if (newPassword !== confirmPassword) {
      setStatus('error')
      setMessage('Passwords do not match')
      return
    }

    setStatus('loading')
    setMessage('')
    try {
      await authAPI.confirmPasswordReset(email, fullCode, newPassword)
      setStatus('success')
      setMessage('Password reset successfully! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.detail || 'Password reset failed. Please try again.')
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
      title="Set New Password"
      subtitle="Enter the reset code from your email and choose a new password"
      footer={
        <AuthFooterLinks secondary={<AuthLink to="/login">← Back to login</AuthLink>} />
      }
    >
      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="font-medium">{message}</p>
        </div>
      )}

      {status !== 'success' && (
        <form onSubmit={handleResetPassword} className="space-y-5">
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
            <label className="label">Reset Code</label>
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

          <div>
            <label className="label">New Password</label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
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
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      )}
    </AuthPageLayout>
  )
}
