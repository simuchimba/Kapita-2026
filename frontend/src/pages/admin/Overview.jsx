import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  Ban,
  Clock3,
  RefreshCw,
  TrendingUp,
  UploadCloud,
  Users,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '../../components/Card'
import Loading from '../../components/Loading'
import { billingAPI } from '../../services/api'
import { formatStatus } from './utils'
import { CHART_COLORS, chartAxisStroke, chartGridStroke, chartTooltipStyle } from './chartTheme'

function StatCard({ title, value, icon: Icon, tone }) {
  const toneClass = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    primary: 'bg-primary-100 text-primary-700',
  }
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${toneClass[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  )
}

function ChartEmpty({ message }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
      {message}
    </div>
  )
}

export default function AdminOverview() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState(null)

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await billingAPI.getAdminOverview()
      setOverview(res.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to load admin overview. Check that you are logged in as staff.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  if (loading) return <Loading />

  const statusData = overview?.status_distribution?.filter((d) => d.value > 0) || []
  const paymentStatusData = overview?.payment_status_chart || []
  const signupsTrend = overview?.signups_trend || []
  const paymentsTrend = overview?.payments_trend || []
  const activityTrend = overview?.activity_trend || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="mt-1 text-gray-600">
            SaaS metrics, user access breakdown, and payment analytics.
          </p>
        </div>
        <button type="button" onClick={loadOverview} className="btn btn-secondary inline-flex items-center gap-2 self-start">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Users" value={overview?.total_users ?? 0} icon={Users} tone="primary" />
        <StatCard title="Active Trials" value={overview?.active_trials ?? 0} icon={Clock3} tone="yellow" />
        <StatCard title="Active Subscriptions" value={overview?.active_subscriptions ?? 0} icon={BadgeCheck} tone="green" />
        <StatCard title="Expired Users" value={overview?.expired_users ?? 0} icon={Ban} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Pending Payments" value={overview?.pending_payment_verifications ?? 0} icon={UploadCloud} tone="blue" />
        <StatCard
          title="Total Revenue (approved)"
          value={`K${Number(overview?.total_revenue ?? 0).toLocaleString()}`}
          icon={Wallet}
          tone="green"
        />
        <StatCard title="Payment Submissions" value={overview?.total_payments ?? 0} icon={TrendingUp} tone="primary" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">User access breakdown</h2>
          {statusData.length === 0 ? (
            <ChartEmpty message="No users yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment submissions by status</h2>
          {paymentStatusData.length === 0 ? (
            <ChartEmpty message="No payment submissions yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={paymentStatusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">New signups (6 months)</h2>
          {signupsTrend.every((d) => d.signups === 0) ? (
            <ChartEmpty message="No signups in the last 6 months." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={signupsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="month" stroke={chartAxisStroke} tick={{ fontSize: 12 }} />
                <YAxis stroke={chartAxisStroke} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="signups" name="Signups" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Approved payments (6 months)</h2>
          {paymentsTrend.every((d) => d.approved === 0) ? (
            <ChartEmpty message="No approved payments yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={paymentsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="month" stroke={chartAxisStroke} tick={{ fontSize: 12 }} />
                <YAxis stroke={chartAxisStroke} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend />
                <Bar dataKey="approved" name="Approved" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Revenue from approved payments</h2>
          {paymentsTrend.every((d) => d.revenue === 0) ? (
            <ChartEmpty message="No revenue recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={paymentsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="month" stroke={chartAxisStroke} tick={{ fontSize: 12 }} />
                <YAxis stroke={chartAxisStroke} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`K${Number(v).toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" name="Revenue (K)" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Platform activity (14 days)</h2>
          {activityTrend.every((d) => d.events === 0) ? (
            <ChartEmpty message="No activity logged yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={activityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="day" stroke={chartAxisStroke} tick={{ fontSize: 11 }} />
                <YAxis stroke={chartAxisStroke} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="events" name="Events" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/payments" className="btn btn-primary">
              Review payments
              {(overview?.pending_payment_verifications ?? 0) > 0 && (
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {overview.pending_payment_verifications}
                </span>
              )}
            </Link>
            <Link to="/admin/users" className="btn btn-secondary">Manage users</Link>
            <Link to="/admin/subscriptions" className="btn btn-secondary">Subscriptions</Link>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent activity</h2>
          <div className="max-h-72 space-y-3 overflow-y-auto">
            {(overview?.recent_activity || []).length === 0 && (
              <p className="text-sm text-gray-500">No activity yet.</p>
            )}
            {(overview?.recent_activity || []).map((log) => (
              <div key={log.id} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{formatStatus(log.action)}</p>
                  <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {log.actor_username || 'system'} → {log.target_username || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
