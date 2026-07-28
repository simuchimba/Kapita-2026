export type BadgeTone = 'green' | 'amber' | 'blue' | 'red' | 'gray';

export function badgeTone(status?: string): BadgeTone {
  switch (status) {
    case 'active_subscription':
    case 'approved':
    case 'active':
    case 'resolved':
      return 'green';
    case 'active_trial':
    case 'reviewed':
      return 'amber';
    case 'pending_payment_verification':
    case 'pending':
    case 'new':
      return 'blue';
    case 'expired':
    case 'rejected':
    case 'revoked':
    case 'inactive':
      return 'red';
    default:
      return 'gray';
  }
}

export function formatStatus(status?: string) {
  return status ? status.replace(/_/g, ' ') : 'unknown';
}

export const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Active trial', value: 'active_trial' },
  { label: 'Active subscription', value: 'active_subscription' },
  { label: 'Expired', value: 'expired' },
  { label: 'Pending payment', value: 'pending_payment_verification' },
];
