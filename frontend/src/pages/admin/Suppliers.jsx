import { useEffect, useState } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import Card from '../../components/Card'
import Loading from '../../components/Loading'
import { billingAPI } from '../../services/api'

export default function AdminSuppliers() {
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const loadSuppliers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await billingAPI.getAdminSuppliers({ search })
      setSuppliers(res.data?.results || res.data || [])
    } catch (err) {
      console.error(err)
      setSuppliers([])
      setError(err.response?.data?.detail || 'Failed to load suppliers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    loadSuppliers()
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="mt-1 text-gray-600">
            View and manage all suppliers across the platform.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSuppliers}
          className="btn btn-secondary inline-flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" onClick={loadSuppliers} className="btn btn-secondary btn-sm">
            Retry
          </button>
        </div>
      )}

      <Card>
        <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-10"
              placeholder="Search supplier name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Suppliers</h2>
          <span className="text-sm text-gray-500">{suppliers.length} results</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Contact Person</th>
                <th className="py-3 pr-4">Phone</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No suppliers found.
                  </td>
                </tr>
              )}
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="border-b border-gray-100">
                  <td className="py-4 pr-4">
                    <p className="text-sm text-gray-600">{supplier.user ? `${supplier.user.first_name || ''} ${supplier.user.last_name || ''}`.trim() || supplier.user.username : '—'}</p>
                    <p className="text-xs text-gray-500">{supplier.user?.email || '—'}</p>
                  </td>
                  <td className="py-4 pr-4 font-medium text-gray-900">{supplier.name}</td>
                  <td className="py-4 pr-4 text-gray-600">{supplier.contact_person || '—'}</td>
                  <td className="py-4 pr-4 text-gray-600">{supplier.phone || '—'}</td>
                  <td className="py-4 pr-4 text-gray-600">{supplier.email || '—'}</td>
                  <td className="py-4 pr-4 text-gray-600">{supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
