import { useEffect, useState } from 'react'
import { BadgeCheck, Ban } from 'lucide-react'
import Card from '../../components/Card'
import Loading from '../../components/Loading'
import { billingAPI } from '../../services/api'
import { badgeClass, formatStatus } from './utils'

export default function AdminPayments() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [payments, setPayments] = useState([])
  const [paymentNotes, setPaymentNotes] = useState({})
  const [filter, setFilter] = useState('pending')

  const loadPayments = async () => {
    setLoading(true)
    try {
      const res = await billingAPI.getAdminPayments({ status: filter })
      setPayments(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [filter])

  const approvePayment = async (paymentId) => {
    setSaving(true)
    try {
      await billingAPI.approvePayment(paymentId, { notes: paymentNotes[paymentId] || '' })
      setPaymentNotes((prev) => ({ ...prev, [paymentId]: '' }))
      await loadPayments()
      alert('Payment approved — 30-day subscription activated.')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve')
    } finally {
      setSaving(false)
    }
  }

  const rejectPayment = async (paymentId) => {
    setSaving(true)
    try {
      await billingAPI.rejectPayment(paymentId, { notes: paymentNotes[paymentId] || '' })
      setPaymentNotes((prev) => ({ ...prev, [paymentId]: '' }))
      await loadPayments()
      alert('Payment rejected.')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reject')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Verification</h1>
        <p className="mt-1 text-gray-600">
          Review payment proofs and approve 30-day subscriptions from the approval date.
        </p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Show</label>
          <select className="input w-48" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
          </select>
        </div>

        <div className="space-y-4">
          {payments.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No payments in this category.
            </div>
          )}
          {payments.map((payment) => (
            <div key={payment.id} className="rounded-2xl border border-gray-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {payment.user_business_name || payment.user_username}
                  </p>
                  <p className="text-sm text-gray-500">{payment.user_email}</p>
                  <p className="mt-1 text-sm text-gray-600">TX: {payment.transaction_id}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(payment.status)}`}>
                  {formatStatus(payment.status)}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                <p><span className="font-medium">Amount:</span> {Number(payment.amount).toLocaleString()}</p>
                <p><span className="font-medium">Submitted:</span> {new Date(payment.created_at).toLocaleString()}</p>
              </div>
              {payment.proof_image_url && (
                <a href={payment.proof_image_url} target="_blank" rel="noreferrer" className="mt-4 block overflow-hidden rounded-xl border border-gray-200">
                  <img src={payment.proof_image_url} alt="Payment proof" className="max-h-64 w-full object-contain bg-gray-50" />
                </a>
              )}
              {payment.status === 'pending' && (
                <>
                  <textarea
                    className="input mt-4"
                    rows={3}
                    placeholder="Admin notes (optional)"
                    value={paymentNotes[payment.id] || ''}
                    onChange={(e) => setPaymentNotes((prev) => ({ ...prev, [payment.id]: e.target.value }))}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button disabled={saving} type="button" onClick={() => approvePayment(payment.id)} className="btn btn-primary inline-flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4" /> Approve (30 days)
                    </button>
                    <button disabled={saving} type="button" onClick={() => rejectPayment(payment.id)} className="btn btn-secondary inline-flex items-center gap-2">
                      <Ban className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </>
              )}
              {payment.admin_notes && (
                <p className="mt-3 text-sm text-gray-700"><span className="font-medium">Notes:</span> {payment.admin_notes}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
