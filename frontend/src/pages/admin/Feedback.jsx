import { useEffect, useState } from 'react'
import {
  Download,
  Search,
  Star,
  Trash2,
  RefreshCw,
  MessageSquarePlus,
  ChevronDown,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import Card from '../../components/Card'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import { feedbackAPI } from '../../services/api'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'resolved', label: 'Resolved' },
]

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'bug', label: '🐛 Bug Report' },
  { value: 'feature', label: '✨ Feature Request' },
  { value: 'ux', label: '🎨 User Experience' },
  { value: 'performance', label: '⚡ Performance' },
  { value: 'general', label: '💬 General' },
]

function statusBadge(s) {
  if (s === 'new') return 'bg-blue-100 text-blue-700'
  if (s === 'reviewed') return 'bg-amber-100 text-amber-700'
  if (s === 'resolved') return 'bg-green-100 text-green-700'
  return 'bg-gray-100 text-gray-600'
}

function StarDisplay({ rating }) {
  if (!rating) return <span className="text-gray-400 text-xs">—</span>
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
      <span className="ml-1 text-xs text-gray-500">{rating}/5</span>
    </div>
  )
}

export default function AdminFeedback() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [stats, setStats] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [listRes, statsRes] = await Promise.all([
        feedbackAPI.getAll({ search, status: statusFilter, category: categoryFilter }),
        feedbackAPI.getStats(),
      ])
      setItems(listRes.data?.results ?? listRes.data ?? [])
      setStats(statsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e) => { e.preventDefault(); load() }

  const openDetail = (item) => {
    setSelected(item)
    setAdminNotes(item.admin_notes || '')
    setShowDetail(true)
  }

  const updateStatus = async (id, newStatus) => {
    setStatusUpdating(true)
    try {
      const res = await feedbackAPI.updateStatus(id, {
        status: newStatus,
        admin_notes: adminNotes,
      })
      setItems((prev) => prev.map((i) => (i.id === id ? res.data : i)))
      setSelected(res.data)
    } catch (err) {
      console.error(err)
      alert('Failed to update status.')
    } finally {
      setStatusUpdating(false)
    }
  }

  const confirmDelete = (item) => { setToDelete(item); setShowDeleteModal(true) }

  const deleteFeedback = async () => {
    try {
      await feedbackAPI.delete(toDelete.id)
      setItems((prev) => prev.filter((i) => i.id !== toDelete.id))
      setShowDeleteModal(false)
      setToDelete(null)
      if (showDetail && selected?.id === toDelete.id) setShowDetail(false)
    } catch (err) {
      alert('Failed to delete.')
    }
  }

  const exportCsv = async () => {
    try {
      const res = await feedbackAPI.exportCsv({
        status: statusFilter,
        category: categoryFilter,
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'kapita_feedback.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Export failed.')
    }
  }

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(14)
    doc.text('Kapita Beta Feedback Report', 14, 15)
    doc.setFontSize(9)
    doc.text(`Exported: ${new Date().toLocaleString()}  |  Total: ${items.length}`, 14, 22)

    const rows = items.map((fb) => [
      new Date(fb.created_at).toLocaleDateString(),
      fb.username,
      fb.email,
      fb.category_display,
      fb.rating ? `${fb.rating}/5` : '—',
      fb.title,
      fb.message.length > 80 ? fb.message.slice(0, 80) + '…' : fb.message,
      fb.status_display,
    ])

    doc.autoTable({
      startY: 27,
      head: [['Date', 'User', 'Email', 'Category', 'Rating', 'Title', 'Message', 'Status']],
      body: rows,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [5, 150, 105] },
    })
    doc.save('kapita_feedback.pdf')
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beta Feedback</h1>
          <p className="mt-1 text-gray-600">Review feedback submitted by test users.</p>
        </div>
        <button type="button" onClick={load} className="btn btn-secondary inline-flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{stats.total}</p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wider text-blue-500">New</p>
            <p className="mt-1 text-3xl font-bold text-blue-600">{stats.by_status?.new ?? 0}</p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wider text-amber-500">Reviewed</p>
            <p className="mt-1 text-3xl font-bold text-amber-600">{stats.by_status?.reviewed ?? 0}</p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wider text-green-500">Resolved</p>
            <p className="mt-1 text-3xl font-bold text-green-600">{stats.by_status?.resolved ?? 0}</p>
          </Card>
        </div>
      )}

      {/* Filters + export */}
      <Card>
        <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-10"
              placeholder="Search title, message, user, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="input appearance-none pr-8 lg:w-44"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="relative">
            <select
              className="input appearance-none pr-8 lg:w-48"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">Search</button>
            <button type="button" onClick={exportCsv} className="btn btn-secondary inline-flex items-center gap-2">
              <Download className="h-4 w-4" /> CSV
            </button>
            <button type="button" onClick={exportPdf} className="btn btn-secondary inline-flex items-center gap-2">
              <Download className="h-4 w-4" /> PDF
            </button>
          </div>
        </form>
      </Card>

      {/* Table */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Responses</h2>
          <span className="text-sm text-gray-500">{items.length} results</span>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <MessageSquarePlus className="h-12 w-12 text-gray-300" />
            <p className="text-sm text-gray-500">No feedback submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Rating</th>
                  <th className="py-3 pr-4">Title</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((fb) => (
                  <tr key={fb.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900">{fb.username}</p>
                      <p className="text-xs text-gray-500">{fb.email}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{fb.category_display}</td>
                    <td className="py-3 pr-4"><StarDisplay rating={fb.rating} /></td>
                    <td className="py-3 pr-4 max-w-[200px]">
                      <p className="truncate font-medium text-gray-900">{fb.title}</p>
                      <p className="truncate text-xs text-gray-500">{fb.message}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(fb.status)}`}>
                        {fb.status_display}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openDetail(fb)}
                          className="btn btn-secondary btn-sm"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(fb)}
                          className="btn btn-sm inline-flex items-center gap-1 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title={selected ? `Feedback #${selected.id} — ${selected.title}` : ''}
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500">User</p>
                <p className="font-medium text-gray-900">{selected.username}</p>
                <p className="text-xs text-gray-500">{selected.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Business</p>
                <p className="text-gray-700">{selected.business_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Category</p>
                <p className="text-gray-700">{selected.category_display}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Rating</p>
                <StarDisplay rating={selected.rating} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Page</p>
                <p className="text-gray-600 text-xs">{selected.page || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Submitted</p>
                <p className="text-gray-600 text-xs">
                  {new Date(selected.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-gray-500">Message</p>
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-800 whitespace-pre-wrap">
                {selected.message}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-gray-500">Admin Notes</p>
              <textarea
                rows={3}
                className="input resize-none text-sm"
                placeholder="Add internal notes…"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-gray-500">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {['new', 'reviewed', 'resolved'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={statusUpdating || selected.status === s}
                    onClick={() => updateStatus(selected.id, s)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                      selected.status === s
                        ? statusBadge(s) + ' cursor-default'
                        : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {statusUpdating && selected.status !== s ? '…' : s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => confirmDelete(selected)}
                className="btn inline-flex items-center gap-2 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
              <button type="button" onClick={() => setShowDetail(false)} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setToDelete(null) }}
        title="Delete Feedback"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Delete feedback from <span className="font-medium">{toDelete?.username}</span>?
            This cannot be undone.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowDeleteModal(false); setToDelete(null) }}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={deleteFeedback}
              className="btn flex-1 bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
