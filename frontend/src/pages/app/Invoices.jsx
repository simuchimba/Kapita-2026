import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { invoicesAPI } from '../../services/api'
import Loading from '../../components/Loading'
import { FileText, Eye, Download, Plus, Search, Send, CheckCircle } from 'lucide-react'

const statusClasses = {
  draft: 'badge badge-yellow',
  sent: 'badge badge-blue',
  paid: 'badge badge-green',
  overdue: 'badge badge-red',
  cancelled: 'badge',
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await invoicesAPI.getAll(params)
      setInvoices(res.data.results || res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { loadInvoices() }, [loadInvoices])

  const handleDownloadPDF = async (id, e) => {
    e.stopPropagation()
    try {
      const res = await invoicesAPI.getPDF(id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url; a.download = `invoice-${id}.pdf`; a.click()
      window.URL.revokeObjectURL(url)
    } catch { }
  }

  const handleMarkPaid = async (id, e) => {
    e.stopPropagation()
    try {
      await invoicesAPI.markPaid(id, {})
      loadInvoices()
    } catch { }
  }

  const handleSend = async (id, e) => {
    e.stopPropagation()
    try {
      await invoicesAPI.send(id)
      loadInvoices()
    } catch { }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Link to="/app/invoices/new" className="btn btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> New Invoice
        </Link>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search invoices..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-40">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-3 font-medium text-gray-600">Invoice #</th>
                <th className="text-left p-3 font-medium text-gray-600">Customer</th>
                <th className="text-left p-3 font-medium text-gray-600">Date</th>
                <th className="text-left p-3 font-medium text-gray-600">Due Date</th>
                <th className="text-right p-3 font-medium text-gray-600">Amount</th>
                <th className="text-right p-3 font-medium text-gray-600">Status</th>
                <th className="text-right p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr><td colSpan={7} className="text-center p-6 text-gray-400">No invoices yet</td></tr>
              )}
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b hover:bg-gray-50 cursor-pointer">
                  <td className="p-3 font-medium">
                    <Link to={`/app/invoices/${inv.id}`} className="text-emerald-600 hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="p-3">{inv.customer_name}</td>
                  <td className="p-3">{inv.issue_date}</td>
                  <td className="p-3">{inv.due_date}</td>
                  <td className="p-3 text-right">
                    {inv.currency} {parseFloat(inv.total_amount).toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <span className={statusClasses[inv.status]}>{inv.status}</span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Link to={`/app/invoices/${inv.id}`} className="btn btn-sm btn-secondary p-1.5" title="View">
                        <Eye size={14} />
                      </Link>
                      <button onClick={e => handleDownloadPDF(inv.id, e)} className="btn btn-sm btn-secondary p-1.5" title="Download PDF">
                        <Download size={14} />
                      </button>
                      {inv.status === 'draft' && (
                        <button onClick={e => handleSend(inv.id, e)} className="btn btn-sm btn-secondary p-1.5" title="Mark Sent">
                          <Send size={14} />
                        </button>
                      )}
                      {(inv.status === 'sent' || inv.status === 'overdue') && (
                        <button onClick={e => handleMarkPaid(inv.id, e)} className="btn btn-sm btn-secondary p-1.5" title="Mark Paid">
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
