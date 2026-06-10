import { BarChart3, ShieldCheck, Sparkles } from 'lucide-react'

const badges = [
  { icon: BarChart3, label: 'Track sales & expenses' },
  { icon: ShieldCheck, label: 'Secure sign-in' },
  { icon: Sparkles, label: '7-day free trial' },
]

export default function AuthTrustBadges() {
  return (
    <ul className="auth-trust-badges">
      {badges.map(({ icon: Icon, label }) => (
        <li key={label} className="auth-trust-badge">
          <Icon className="h-3.5 w-3.5 shrink-0 text-primary-600" strokeWidth={2} />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  )
}
