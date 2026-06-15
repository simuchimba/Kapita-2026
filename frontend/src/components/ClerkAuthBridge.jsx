import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth, useClerk, useUser, SignUp } from '@clerk/react'
import { useAuthStore } from '../store/authStore'
import { setClerkTokenGetter } from '../services/api'
import { isAuthRoute, isProtectedRoute, isPublicRoute } from '../utils/routes'
import Loading from './Loading'
import ClerkSyncError from './ClerkSyncError'
import AuthPageLayout from './auth/AuthPageLayout'
import { AuthFooterLinks, AuthLink } from './auth/AuthFooter'
import { kapitaClerkAppearance } from '../config/clerkAppearance'

export default function ClerkAuthBridge({ children }) {
  const location = useLocation()
  const { isLoaded: isAuthLoaded, isSignedIn, getToken } = useAuth()
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser()
  const { signOut } = useClerk()
  const { hydrateSession, logout, setClerkSignOut, sessionLoading, user, error } =
    useAuthStore()

  const onPublicRoute = isPublicRoute(location.pathname)
  const onProtectedRoute = isProtectedRoute(location.pathname)
  const onAuthRoute = isAuthRoute(location.pathname)
  const needsKapitaProfile = isSignedIn && !user && !sessionLoading && !error

  const isLoaded = isAuthLoaded && isUserLoaded

  // Check if email is verified
  const isEmailVerified = clerkUser?.primaryEmailAddress?.verification?.status === 'verified'

  useEffect(() => {
    setClerkTokenGetter(() => getToken())
    setClerkSignOut(signOut)
  }, [getToken, signOut, setClerkSignOut])

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn) {
      if (needsKapitaProfile && isEmailVerified) {
        hydrateSession()
      }
      return
    }

    const legacyToken = localStorage.getItem('access_token')
    if (legacyToken) {
      if (!user && !sessionLoading) {
        hydrateSession()
      }
      return
    }

    if (user || sessionLoading) {
      logout({ skipClerk: true })
    }
  }, [
    isLoaded,
    isSignedIn,
    hydrateSession,
    logout,
    user,
    sessionLoading,
    needsKapitaProfile,
    isEmailVerified,
  ])

  if (!isLoaded && onProtectedRoute) {
    return <Loading fullScreen message="Loading…" />
  }

  if (isSignedIn && !isEmailVerified && (onProtectedRoute || onAuthRoute)) {
    const footer = (
      <AuthFooterLinks
        secondary={<AuthLink to="/">← Back to home</AuthLink>}
      />
    )
    return (
      <AuthPageLayout
        title="Verify your email"
        subtitle="Please verify your email address to continue"
        footer={footer}
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

  if (isSignedIn && sessionLoading && (onProtectedRoute || onAuthRoute)) {
    return <Loading fullScreen message="Setting up your account…" />
  }

  if (isSignedIn && !user && error && (onProtectedRoute || onAuthRoute)) {
    return <ClerkSyncError message={error} onRetry={() => hydrateSession()} />
  }

  if (isSignedIn && !user && error && !onPublicRoute) {
    return <ClerkSyncError message={error} onRetry={() => hydrateSession()} />
  }

  return children
}
