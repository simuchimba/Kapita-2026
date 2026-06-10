/** Where to send the user after Kapita session is established. */
export function getPostAuthPath(user) {
  if (!user) return '/login'

  if (user.is_staff) {
    return '/admin/overview'
  }

  if (
    user.is_expired ||
    user.access_status === 'expired' ||
    user.access_status === 'pending_payment_verification'
  ) {
    return '/app/billing'
  }

  return '/app/dashboard'
}

export { isAuthRoute } from './routes'
