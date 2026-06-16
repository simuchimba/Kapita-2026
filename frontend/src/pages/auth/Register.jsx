import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthPageLayout from '../../components/auth/AuthPageLayout'
import { AuthFooterLinks, AuthLink } from '../../components/auth/AuthFooter'
import { useAuthStore } from '../../store/authStore'
import PasswordInput from '../../components/PasswordInput'

export default function Register() {
  const navigate = useNavigate()
  const { register, loading } = useAuthStore()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    business_name: '',
    phone: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const signInFooter = (
    <AuthFooterLinks
      primary={
        <p>
          Already have an account? <AuthLink to="/login">Sign in</AuthLink>
        </p>
      }
      secondary={<AuthLink to="/">← Back to home</AuthLink>}
    />
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setIsSubmitting(true)

    if (formData.password !== formData.password2) {
      setErrors({ password2: ['Passwords do not match'] })
      setIsSubmitting(false)
      return
    }

    const result = await register(formData)
    if (result.success) {
      navigate(`/verify-email?email=${encodeURIComponent(result.email)}`)
    } else {
      setErrors(result.error || {})
    }
    setIsSubmitting(false)
  }

  const renderError = (fieldName) => {
    if (!errors[fieldName]) return null
    const message = Array.isArray(errors[fieldName])
      ? errors[fieldName][0]
      : errors[fieldName]
    return (
      <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
        <span className="text-xs">⚠️</span> {message}
      </p>
    )
  }

  return (
    <AuthPageLayout
      title="Create your account"
      subtitle="Start your free trial and track your business in one place"
      footer={signInFooter}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.detail && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {Array.isArray(errors.detail) ? errors.detail[0] : errors.detail}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First Name</label>
            <input
              type="text"
              required
              className={`input ${errors.first_name ? 'border-red-500 focus:ring-red-500' : ''}`}
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            {renderError('first_name')}
          </div>

          <div>
            <label className="label">Last Name</label>
            <input
              type="text"
              required
              className={`input ${errors.last_name ? 'border-red-500 focus:ring-red-500' : ''}`}
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
            {renderError('last_name')}
          </div>
        </div>

        <div>
          <label className="label">Username</label>
          <input
            type="text"
            required
            className={`input ${errors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          {renderError('username')}
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          {renderError('email')}
        </div>

        <div>
          <label className="label">Business Name <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
          <input
            type="text"
            className="input"
            value={formData.business_name}
            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Phone <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
          <input
            type="tel"
            className="input"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Password</label>
          <PasswordInput
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className={errors.password ? 'border-red-500 focus:ring-red-500' : ''}
          />
          {renderError('password')}
        </div>

        <div>
          <label className="label">Confirm Password</label>
          <PasswordInput
            value={formData.password2}
            onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
            required
            placeholder="Confirm Password"
            className={errors.password2 ? 'border-red-500 focus:ring-red-500' : ''}
          />
          {renderError('password2')}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating your account...
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>
    </AuthPageLayout>
  )
}
