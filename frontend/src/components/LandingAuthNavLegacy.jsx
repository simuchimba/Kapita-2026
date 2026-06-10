import { Link } from 'react-router-dom'
import { LogIn } from 'lucide-react'

export default function LandingAuthNavLegacy() {
  return (
    <>
      <Link to="/login" className="landing-btn-ghost hidden sm:inline-flex">
        Sign In
      </Link>
      <Link to="/login" className="landing-btn-ghost px-3 py-2 sm:hidden" aria-label="Sign In">
        <LogIn className="h-4 w-4" />
      </Link>
      <Link to="/register" className="landing-btn-nav-cta">
        Get Started
      </Link>
    </>
  )
}
