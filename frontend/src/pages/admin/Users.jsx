import { useEffect, useState } from 'react'
import { Download, Search } from 'lucide-react'
import Card from '../../components/Card'
import Loading from '../../components/Loading'
import { billingAPI } from '../../services/api'
import { badgeClass, formatStatus, statusOptions } from './utils'

export default function AdminUsers() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await billingAPI.getAdminUsers({ search, status: statusFilter })
      setUsers(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    loadUsers()
  }

  const exportCsv = async () => {
    try {
      const response = await billingAPI.exportAdminUsersCsv({ search, status: statusFilter })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'users_export.csv'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Failed to export CSV')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <p className="mt-1 text-gray-600">Search, filter, and export all platform users.</p>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-10"
              placeholder="Search name, email, or business"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input lg:w-56" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusOptions.map((o) => (
              <option key={o.value || 'all'} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">Search</button>
            <button type="button" onClick={exportCsv} className="btn btn-secondary inline-flex items-center gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All users</h2>
          <span className="text-sm text-gray-500">{users.length} results</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Signup</th>
                <th className="py-3 pr-4">Trial end</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Days left</th>
                <th className="py-3 pr-4">Last payment</th>
                <th className="py-3 pr-4">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100">
                  <td className="py-4 pr-4">
                    <p className="font-medium text-gray-900">
                      {`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}
                    </p>
                    <p className="text-xs text-gray-500">{user.business_name || '—'}</p>
                  </td>
                  <td className="py-4 pr-4 text-gray-600">{user.email}</td>
                  <td className="py-4 pr-4 text-gray-600">
                    {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-4 pr-4 text-gray-600">
                    {user.trial_end_date ? new Date(user.trial_end_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-4 pr-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(user.access_status)}`}>
                      {formatStatus(user.access_status)}
                    </span>
                  </td>
                  <td className="py-4 pr-4 font-medium text-gray-900">{user.days_remaining ?? 0}</td>
                  <td className="py-4 pr-4 text-gray-600">
                    {user.last_payment_date ? new Date(user.last_payment_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-4 pr-4 text-gray-600">
                    {user.expiry_date ? new Date(user.expiry_date).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
