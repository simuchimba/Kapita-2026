import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { invoicesAPI } from '../../services/api'
import Loading from '../../components/Loading'
import { ArrowLeft, Download, Send, CheckCircle, Edit, Printer } from 'lucide-react'

const statusClasses = {
  draft: 'badge badge-yellow',
  sent: 'badge badge-blue',
  paid: 'badge badge-green',
  overdue: 'badge badge-red',
  cancelled: 'badge',
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    invoicesAPI.getOne(id).then(res => {
      setInvoice(res.data)
      setLoading(false)
    }).catch(err => {
      setError(err.response?.data?.detail || 'Failed to load invoice')
      setLoading(false)
    })
  }, [id])

  const handleDownloadPDF = async () => {
    try {
      const res = await invoicesAPI.getPDF(id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `Invoice_${invoice.invoice_number}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch { }
  }

  const handleMarkPaid = async () => {
    try {
      const res = await invoicesAPI.markPaid(id, {})
      setInvoice(res.data)
    } catch { }
  }

  const handleSend = async () => {
    try {
      const res = await invoicesAPI.send(id)
      setInvoice(res.data)
    } catch { }
  }

  if (loading) return <Loading />
  if (error) return <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
  if (!invoice) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app/invoices')} className="btn btn-secondary p-2">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
          <span className={statusClasses[invoice.status]}>{invoice.status}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadPDF} className="btn btn-secondary inline-flex items-center gap-1">
            <Download size={16} /> PDF
          </button>
          {invoice.status === 'draft' && (
            <>
              <button onClick={handleSend} className="btn btn-secondary inline-flex items-center gap-1">
                <Send size={16} /> Mark Sent
              </button>
              <button onClick={() => navigate(`/app/invoices/${id}/edit`)} className="btn btn-secondary inline-flex items-center gap-1">
                <Edit size={16} /> Edit
              </button>
            </>
          )}
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <button onClick={handleMarkPaid} className="btn btn-primary inline-flex items-center gap-1">
              <CheckCircle size={16} /> Mark Paid
            </button>
          )}
        </div>
      </div>

      <div className="card p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-emerald-600">INVOICE</h2>
            <p className="text-gray-500 mt-1">{invoice.invoice_number}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Bill To:</h3>
            <p className="text-gray-900">{invoice.customer_name}</p>
            {invoice.customer_address && <p className="text-gray-500 text-sm">{invoice.customer_address}</p>}
            {invoice.customer_email && <p className="text-gray-500 text-sm">{invoice.customer_email}</p>}
            {invoice.customer_phone && <p className="text-gray-500 text-sm">{invoice.customer_phone}</p>}
          </div>
          <div className="text-right">
            <p><span className="text-gray-500">Issue Date:</span> <span className="font-medium">{invoice.issue_date}</span></p>
            <p><span className="text-gray-500">Due Date:</span> <span className="font-medium">{invoice.due_date}</span></p>
            <p><span className="text-gray-500">Currency:</span> <span className="font-medium">{invoice.currency}</span></p>
          </div>
        </div>

        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="bg-emerald-600 text-white">
              <th className="text-left p-3">#</th>
              <th className="text-left p-3">Description</th>
              <th className="text-center p-3">Qty</th>
              <th className="text-right p-3">Unit Price</th>
              <th className="text-right p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={item.id} className="border-b">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">{item.description}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right">{parseFloat(item.unit_price).toFixed(2)}</td>
                <td className="p-3 text-right font-medium">{parseFloat(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal:</span>
              <span>{parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
            {invoice.tax_rate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">{invoice.tax_name || 'Tax'} ({invoice.tax_rate}%):</span>
                <span>{parseFloat(invoice.tax_amount).toFixed(2)}</span>
              </div>
            )}
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">{invoice.discount_name || 'Discount'}:</span>
                <span>-{parseFloat(invoice.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span className="text-emerald-600">{invoice.currency} {parseFloat(invoice.total_amount).toFixed(2)}</span>
            </div>
            {invoice.amount_paid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount Paid:</span>
                <span className="text-green-600">{parseFloat(invoice.amount_paid).toFixed(2)}</span>
              </div>
            )}
            {invoice.balance_due > 0 && (
              <div className="flex justify-between font-semibold">
                <span>Balance Due:</span>
                <span className="text-red-600">{parseFloat(invoice.balance_due).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-700 mb-1">Notes:</h4>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}
        {invoice.terms_conditions && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-700 mb-1">Terms & Conditions:</h4>
            <p className="text-sm text-gray-600">{invoice.terms_conditions}</p>
          </div>
        )}
      </div>
    </div>
  )
}
