import { Link } from 'react-router-dom'
import AuthTrustBadges from './AuthTrustBadges'

function KapitaLogo() {
  return (
    <div className="auth-logo-ring">
      <img
        src="/logo1.png"
        alt="Kapita Logo"
        className="h-16 w-auto object-contain sm:h-[4.5rem]"
        onError={(e) => {
          e.target.style.display = 'none'
          e.target.nextElementSibling.style.display = 'flex'
        }}
      />
      <div className="hidden h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 sm:h-[4.5rem] sm:w-[4.5rem]">
        <span className="text-3xl font-bold text-white">K</span>
      </div>
    </div>
  )
}

export default function AuthPageLayout({
  title,
  subtitle,
  children,
  footer,
  showBadges = true,
  variant = 'default',
}) {
  return (
    <div className="auth-page">
      <div className="auth-page-grid" aria-hidden />
      <div className="auth-page-glow auth-page-glow-left" aria-hidden />
      <div className="auth-page-glow auth-page-glow-right" aria-hidden />

      <div className="auth-page-topbar">
        <Link to="/" className="auth-topbar-link">
          ← Kapita home
        </Link>
      </div>

      <div className="auth-page-shell">
        <header className="auth-header">
          <Link to="/" className="inline-block transition-opacity hover:opacity-90" aria-label="Kapita home">
            <KapitaLogo />
          </Link>
          <p className="auth-eyebrow">{variant === 'admin' ? 'Administration' : 'Business finance'}</p>
          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {showBadges && variant === 'default' && <AuthTrustBadges />}
        </header>

        <div className={`auth-card clerk-kapita ${variant === 'admin' ? 'auth-card-admin' : ''}`}>
          <div className="auth-card-accent" aria-hidden />
          <div className="auth-card-body">{children}</div>
        </div>

        {footer}
      </div>
    </div>
  )
}

export { KapitaLogo }
