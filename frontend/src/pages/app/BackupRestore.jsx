import { useState } from 'react'
import { backupAPI } from '../../services/api'
import { Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react'

export default function BackupRestore() {
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleExport = async () => {
    setExporting(true)
    setMessage({ type: '', text: '' })
    try {
      const res = await backupAPI.exportBackup()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      const ts = new Date().toISOString().replace(/[:.]/g, '-')
      a.download = `kapita_backup_${ts}.zip`
      a.click()
      window.URL.revokeObjectURL(url)
      setMessage({ type: 'success', text: 'Backup exported successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Export failed' })
    } finally {
      setExporting(false)
    }
  }

  const handleRestore = async () => {
    if (!file) return
    if (!confirm('Restore will replace all your current data with the backup. Are you sure?')) return

    setRestoring(true)
    setMessage({ type: '', text: '' })
    try {
      const res = await backupAPI.restoreBackup(file)
      setMessage({ type: 'success', text: `Restore complete! ${Object.entries(res.data.restored || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}` })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Restore failed' })
    } finally {
      setRestoring(false)
      setFile(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Backup & Restore</h1>

      {message.text && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {message.text}
        </div>
      )}

      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Export Data</h2>
        <p className="text-sm text-gray-500">
          Download all your business data (products, sales, customers, invoices, and more) as a ZIP file.
          This includes your company logo if uploaded.
        </p>
        <button onClick={handleExport} disabled={exporting} className="btn btn-primary inline-flex items-center gap-2">
          <Download size={18} /> {exporting ? 'Exporting...' : 'Download Backup'}
        </button>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Restore Data</h2>
        <p className="text-sm text-gray-500">
          Upload a previously exported backup ZIP file to restore your data.
          <span className="block text-red-500 font-medium mt-1">
            Warning: This will replace all your current data!
          </span>
        </p>
        <div className="space-y-3">
          <input
            type="file"
            accept=".zip"
            onChange={e => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />
          <button onClick={handleRestore} disabled={!file || restoring} className="btn btn-danger inline-flex items-center gap-2">
            <Upload size={18} /> {restoring ? 'Restoring...' : 'Restore from Backup'}
          </button>
        </div>
      </div>

      <div className="card p-6 space-y-3">
        <h2 className="text-lg font-semibold">What's Included</h2>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Products & Inventory</li>
          <li>Sales Transactions</li>
          <li>Customers</li>
          <li>Credits & Payments</li>
          <li>Expenses & Reinvestments</li>
          <li>Invoices & Quotations</li>
          <li>Purchase Orders & Suppliers</li>
          <li>Promotions & Discounts</li>
          <li>Outgoing Payments</li>
          <li>Personal Finance</li>
          <li>Exchange Rates</li>
          <li>Company Logo</li>
        </ul>
      </div>
    </div>
  )
}
