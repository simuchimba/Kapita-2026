import { useEffect, useState } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import Card from '../../components/Card'
import Loading from '../../components/Loading'
import { billingAPI } from '../../services/api'

export default function AdminPurchaseOrders() {
  const [loading, setLoading] = useState(true)
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')

  const loadPurchaseOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await billingAPI.getAdminPurchaseOrders({ search, status: statusFilter })
      setPurchaseOrders(res.data?.results || res.data || [])
    } catch (err) {
      console.error(err)
      setPurchaseOrders([])
      setError(err.response?.data?.detail || 'Failed to load purchase orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPurchaseOrders()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    loadPurchaseOrders()
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'ordered':
        return 'bg-blue-100 text-blue-700'
      case 'received':
        return 'bg-green-100 text-green-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="mt-1 text-gray-600">
            View and manage all purchase orders across the platform.
          </p>
        </div>
        <button
          type="button"
          onClick={loadPurchaseOrders}
          className="btn btn-secondary inline-flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" onClick={loadPurchaseOrders} className="btn btn-secondary btn-sm">
            Retry
          </button>
        </div>
      )}

      <Card>
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 lg:flex-row lg:items-center"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-10"
              placeholder="Search PO ID or supplier name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input lg:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Purchase Orders</h2>
          <span className="text-sm text-gray-500">{purchaseOrders.length} results</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-3 pr-4">PO ID</th>
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Supplier</th>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Expected Delivery</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No purchase orders found.
                  </td>
                </tr>
              )}
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="border-b border-gray-100">
                  <td className="py-4 pr-4 font-medium text-gray-900">#{po.id}</td>
                  <td className="py-4 pr-4">
                    <p className="text-sm text-gray-600">{po.user ? `${po.user.first_name || ''} ${po.user.last_name || ''}`.trim() || po.user.username : '—'}</p>
                    <p className="text-xs text-gray-500">{po.user?.email || '—'}</p>
                  </td>
                  <td className="py-4 pr-4 text-gray-600">{po.supplier_details?.name || '—'}</td>
                  <td className="py-4 pr-4 text-gray-600">{po.order_date ? new Date(po.order_date).toLocaleDateString() : '—'}</td>
                  <td className="py-4 pr-4 text-gray-600">{po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : '—'}</td>
                  <td className="py-4 pr-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(po.status)}`}>
                      {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 pr-4 font-medium text-gray-900">
                    K{Number(po.total_amount).toLocaleString()}
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
