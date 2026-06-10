import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getPostAuthPath, isAuthRoute } from '../utils/postAuthPath'

/** Redirects authenticated users off auth pages once Kapita profile is loaded. */
export default function PostAuthRedirect() {
  const location = useLocation()
  const { isAuthenticated, user, sessionLoading } = useAuthStore()

  if (sessionLoading || !isAuthenticated || !user) {
    return null
  }

  if (isAuthRoute(location.pathname)) {
    return <Navigate to={getPostAuthPath(user)} replace />
  }

  return null
}
