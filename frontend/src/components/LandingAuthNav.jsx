import { Link } from 'react-router-dom'
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/react'
import { LogIn } from 'lucide-react'

export default function LandingAuthNav() {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="redirect" forceRedirectUrl="/login">
          <button type="button" className="landing-btn-ghost hidden sm:inline-flex">
            Sign In
          </button>
        </SignInButton>
        <SignInButton mode="redirect" forceRedirectUrl="/login">
          <button
            type="button"
            className="landing-btn-ghost px-3 py-2 sm:hidden"
            aria-label="Sign In"
          >
            <LogIn className="h-4 w-4" />
          </button>
        </SignInButton>
        <SignUpButton mode="redirect" forceRedirectUrl="/register">
          <button type="button" className="landing-btn-nav-cta">
            Get Started
          </button>
        </SignUpButton>
      </Show>

      <Show when="signed-in">
        <Link to="/app/dashboard" className="landing-btn-ghost hidden sm:inline-flex">
          Dashboard
        </Link>
        <UserButton afterSignOutUrl="/" />
      </Show>
    </>
  )
}
