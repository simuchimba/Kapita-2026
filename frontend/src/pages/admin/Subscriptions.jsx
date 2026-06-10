import { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Loading from '../../components/Loading'
import { billingAPI } from '../../services/api'
import { badgeClass, formatStatus } from './utils'

export default function AdminSubscriptions() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [history, setHistory] = useState([])
  const [extendDays, setExtendDays] = useState('30')
  const [extendNotes, setExtendNotes] = useState('')

  useEffect(() => {
    billingAPI.getAdminUsers()
      .then((res) => setUsers(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const selectedUser = users.find((u) => String(u.id) === String(selectedUserId))

  const loadHistory = async (userId) => {
    if (!userId) return
    const res = await billingAPI.getSubscriptionHistory(userId)
    setHistory(res.data || [])
  }

  const handleUserChange = (e) => {
    const id = e.target.value
    setSelectedUserId(id)
    if (id) loadHistory(id)
    else setHistory([])
  }

  const extendSubscription = async () => {
    if (!selectedUserId) return
    const days = Number(extendDays)
    if (!days || days < 1) {
      alert('Enter valid days')
      return
    }
    setSaving(true)
    try {
      await billingAPI.extendSubscription(selectedUserId, { days, notes: extendNotes })
      await loadHistory(selectedUserId)
      setExtendNotes('')
      alert('Subscription extended.')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to extend')
    } finally {
      setSaving(false)
    }
  }

  const revokeSubscription = async () => {
    if (!selectedUserId || !window.confirm('Revoke active subscription for this user?')) return
    setSaving(true)
    try {
      await billingAPI.revokeSubscription(selectedUserId)
      await loadHistory(selectedUserId)
      alert('Subscription revoked.')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to revoke')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
        <p className="mt-1 text-gray-600">Extend, revoke, and view subscription history per user.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Select user</h2>
          <select className="input" value={selectedUserId} onChange={handleUserChange}>
            <option value="">Choose a user…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} — {formatStatus(u.access_status)} ({u.days_remaining ?? 0}d left)
              </option>
            ))}
          </select>

          {selectedUser && (
            <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
              <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
              <p><span className="font-medium">Status:</span>{' '}
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass(selectedUser.access_status)}`}>
                  {formatStatus(selectedUser.access_status)}
                </span>
              </p>
              <p><span className="font-medium">Days remaining:</span> {selectedUser.days_remaining ?? 0}</p>
              <p><span className="font-medium">Expiry:</span>{' '}
                {selectedUser.expiry_date ? new Date(selectedUser.expiry_date).toLocaleDateString() : '—'}
              </p>
            </div>
          )}

          {selectedUserId && (
            <div className="mt-6 space-y-3 border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900">Manual actions</h3>
              <input className="input" type="number" min="1" value={extendDays} onChange={(e) => setExtendDays(e.target.value)} placeholder="Days to extend" />
              <textarea className="input" rows={2} value={extendNotes} onChange={(e) => setExtendNotes(e.target.value)} placeholder="Notes (optional)" />
              <button type="button" disabled={saving} onClick={extendSubscription} className="btn btn-primary w-full">
                Extend subscription
              </button>
              <button type="button" disabled={saving} onClick={revokeSubscription} className="btn btn-secondary w-full">
                Revoke subscription
              </button>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Subscription history</h2>
          {!selectedUserId ? (
            <p className="text-sm text-gray-500">Select a user to view history.</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-500">No subscription records yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-gray-900">
                      {new Date(entry.start_date).toLocaleDateString()} → {new Date(entry.end_date).toLocaleDateString()}
                    </p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(entry.status)}`}>
                      {formatStatus(entry.status)}
                    </span>
                  </div>
                  {entry.notes && <p className="mt-2 text-sm text-gray-600">{entry.notes}</p>}
                  <p className="mt-1 text-xs text-gray-500">Payment ID: {entry.source_payment_id || 'manual'}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
