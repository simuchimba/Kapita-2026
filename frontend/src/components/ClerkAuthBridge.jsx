import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth, useClerk } from '@clerk/react'
import { useAuthStore } from '../store/authStore'
import { setClerkTokenGetter } from '../services/api'
import { isAuthRoute, isProtectedRoute, isPublicRoute } from '../utils/routes'
import Loading from './Loading'
import ClerkSyncError from './ClerkSyncError'

export default function ClerkAuthBridge({ children }) {
  const location = useLocation()
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { signOut } = useClerk()
  const { hydrateSession, logout, setClerkSignOut, sessionLoading, user, error } =
    useAuthStore()

  const onPublicRoute = isPublicRoute(location.pathname)
  const onProtectedRoute = isProtectedRoute(location.pathname)
  const onAuthRoute = isAuthRoute(location.pathname)
  const needsKapitaProfile = isSignedIn && !user && !sessionLoading && !error

  useEffect(() => {
    setClerkTokenGetter(() => getToken())
    setClerkSignOut(signOut)
  }, [getToken, signOut, setClerkSignOut])

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn) {
      if (needsKapitaProfile) {
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
  ])

  if (!isLoaded && onProtectedRoute) {
    return <Loading fullScreen message="Loading…" />
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
