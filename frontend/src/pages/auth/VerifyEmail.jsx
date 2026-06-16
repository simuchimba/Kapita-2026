import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AuthPageLayout from '../../components/auth/AuthPageLayout'
import { AuthFooterLinks, AuthLink } from '../../components/auth/AuthFooter'
import { authAPI } from '../../services/api'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    const verify = async () => {
      try {
        await authAPI.verifyEmail(token)
        setStatus('success')
        setMessage('Email verified successfully! Redirecting to login...')
        setTimeout(() => navigate('/login'), 2000)
      } catch (err) {
        setStatus('error')
        setMessage(err.response?.data?.detail || 'Verification failed')
      }
    }

    verify()
  }, [searchParams, navigate])

  return (
    <AuthPageLayout
      title="Verify Email"
      subtitle="Confirm your email address"
      footer={
        <AuthFooterLinks secondary={<AuthLink to="/">← Back to home</AuthLink>} />
      }
    >
      <div className="text-center py-8">
        {status === 'loading' && (
          <div className="text-gray-600">Verifying your email...</div>
        )}
        {status === 'success' && (
          <div className="text-green-600 font-medium">{message}</div>
        )}
        {status === 'error' && (
          <div>
            <div className="text-red-600 font-medium mb-4">{message}</div>
            <AuthLink to="/register">Sign up again</AuthLink>
          </div>
        )}
      </div>
    </AuthPageLayout>
  )
}
