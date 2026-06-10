import { Link } from 'react-router-dom'

export default function AuthFooter({ children }) {
  return (
    <div className="auth-footer">
      {children}
      <p className="auth-footer-note">
        Secure authentication · Your data stays on Kapita
      </p>
    </div>
  )
}

export function AuthFooterLinks({ primary, secondary }) {
  return (
    <AuthFooter>
      {primary && <div className="auth-footer-primary">{primary}</div>}
      {secondary && <div className="auth-footer-secondary">{secondary}</div>}
    </AuthFooter>
  )
}

export function AuthLink({ to, children }) {
  return (
    <Link to={to} className="auth-link">
      {children}
    </Link>
  )
}
