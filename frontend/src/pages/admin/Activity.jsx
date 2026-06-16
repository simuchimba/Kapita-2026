import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import Card from '../../components/Card'
import Loading from '../../components/Loading'
import { billingAPI } from '../../services/api'
import { formatStatus } from './utils'

export default function AdminActivity() {
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState([])

  const exportActivityToCSV = () => {
    if (activity.length === 0) return
    const headers = ['ID', 'Action', 'Actor', 'Target', 'Created At', 'Details']
    const rows = activity.map(log => [
      log.id,
      formatStatus(log.action),
      log.actor_username || 'system',
      log.target_username || 'N/A',
      new Date(log.created_at).toLocaleString(),
      JSON.stringify(log.details || {})
    ])
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `kapita-activity-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    billingAPI.getActivityLogs()
      .then((res) => setActivity(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="mt-1 text-gray-600">Audit trail for trials, payments, and subscription changes.</p>
        </div>
        <button type="button" onClick={exportActivityToCSV} disabled={activity.length === 0} className="btn btn-secondary inline-flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <Card>
        <div className="space-y-3">
          {activity.length === 0 && (
            <p className="text-sm text-gray-500">No activity recorded yet.</p>
          )}
          {activity.map((log) => (
            <div key={log.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-gray-900">{formatStatus(log.action)}</p>
                <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Actor: <span className="font-medium">{log.actor_username || 'system'}</span>
                {' · '}
                Target: <span className="font-medium">{log.target_username || 'N/A'}</span>
              </p>
              {log.details && Object.keys(log.details).length > 0 && (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-50 p-2 text-xs text-gray-700">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
