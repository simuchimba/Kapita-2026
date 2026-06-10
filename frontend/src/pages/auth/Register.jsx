import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignUp } from '@clerk/react'
import AuthPageLayout from '../../components/auth/AuthPageLayout'
import { AuthFooterLinks, AuthLink } from '../../components/auth/AuthFooter'
import { kapitaClerkAppearance } from '../../config/clerkAppearance'
import { useAuthStore } from '../../store/authStore'
import { isClerkEnabled } from '../../config/auth'
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

  if (isClerkEnabled) {
    return (
      <AuthPageLayout
        title="Create your account"
        subtitle="Start your free trial and track your business in one place"
        footer={signInFooter}
      >
        <SignUp
          routing="virtual"
          signInUrl="/login"
          forceRedirectUrl="/app/dashboard"
          appearance={kapitaClerkAppearance}
        />
      </AuthPageLayout>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    if (formData.password !== formData.password2) {
      setErrors({ password2: ['Passwords do not match'] })
      return
    }

    const result = await register(formData)
    if (result.success) {
      navigate('/login')
    } else {
      setErrors(result.error || {})
    }
  }

  return (
    <AuthPageLayout
      title="Create your account"
      subtitle="Start your free trial and track your business in one place"
      footer={signInFooter}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-5">
          <div>
            <label className="label">First Name</label>
            <input
              type="text"
              required
              className="input"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Last Name</label>
            <input
              type="text"
              required
              className="input"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Username</label>
            <input
              type="text"
              required
              className="input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username[0]}</p>
            )}
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>
            )}
          </div>

          <div>
            <label className="label">Business Name</label>
            <input
              type="text"
              className="input"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Phone</label>
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
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>
            )}
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <PasswordInput
              value={formData.password2}
              onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
              required
              placeholder="Confirm Password"
            />
            {errors.password2 && (
              <p className="mt-1 text-sm text-red-600">{errors.password2[0]}</p>
            )}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthPageLayout>
  )
}
