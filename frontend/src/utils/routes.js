const PUBLIC_PATHS = ['/', '/login', '/register', '/admin/login']
const AUTH_PATHS = ['/login', '/register']

export function isPublicRoute(pathname) {
  return PUBLIC_PATHS.includes(pathname)
}

export function isAuthRoute(pathname) {
  return AUTH_PATHS.includes(pathname)
}

export function isProtectedRoute(pathname) {
  return pathname.startsWith('/app') || pathname.startsWith('/admin')
}
