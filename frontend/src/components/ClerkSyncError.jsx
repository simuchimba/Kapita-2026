import AuthPageLayout from './auth/AuthPageLayout'
import { AuthFooterLinks, AuthLink } from './auth/AuthFooter'

export default function ClerkSyncError({ message, onRetry }) {
  return (
    <AuthPageLayout
      showBadges={false}
      title="Connection issue"
      subtitle="You're signed in, but Kapita couldn't load your profile"
      footer={
        <AuthFooterLinks secondary={<AuthLink to="/">← Back to home</AuthLink>} />
      }
    >
      <div className="space-y-4 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message ||
            'Make sure the Kapita backend is running on port 8000, then try again.'}
        </div>
        <button type="button" onClick={onRetry} className="btn btn-primary w-full">
          Try again
        </button>
      </div>
    </AuthPageLayout>
  )
}
