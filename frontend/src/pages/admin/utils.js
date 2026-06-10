export function badgeClass(status) {
  switch (status) {
    case 'active_subscription':
    case 'approved':
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'active_trial':
      return 'bg-yellow-100 text-yellow-800'
    case 'pending_payment_verification':
    case 'pending':
      return 'bg-blue-100 text-blue-800'
    case 'expired':
    case 'rejected':
    case 'revoked':
    case 'inactive':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function formatStatus(status) {
  return status ? status.replace(/_/g, ' ') : 'unknown'
}

export const statusOptions = [
  { label: 'All statuses', value: '' },
  { label: 'Active trial', value: 'active_trial' },
  { label: 'Active subscription', value: 'active_subscription' },
  { label: 'Expired', value: 'expired' },
  { label: 'Pending payment', value: 'pending_payment_verification' },
]
