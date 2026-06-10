import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BadgeCheck, Clock3, FileUp, Loader2, Receipt, ShieldCheck, UploadCloud } from 'lucide-react'
import Card from '../components/Card'
import Loading from '../components/Loading'
import { billingAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'

const MONTHLY_AMOUNT = '29.99'

function accessBadgeClasses(status) {
  switch (status) {
    case 'active_subscription':
      return 'bg-green-100 text-green-800'
    case 'active_trial':
      return 'bg-yellow-100 text-yellow-800'
    case 'pending_payment_verification':
      return 'bg-blue-100 text-blue-800'
    case 'expired':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function submissionBadgeClasses(status) {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    case 'pending':
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

function parseHistoryList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

export default function Billing() {
  const { fetchUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [status, setStatus] = useState(null)
  const [history, setHistory] = useState([])
  const [preview, setPreview] = useState('')
  const [formData, setFormData] = useState({
    proof_image: null,
    transaction_id: '',
    amount: MONTHLY_AMOUNT,
    notes: '',
  })

  const hasPendingSubmission = useMemo(
    () => history.some((item) => item.status === 'pending'),
    [history]
  )

  const canSubmit =
    status?.access_status === 'expired' &&
    !hasPendingSubmission &&
    !submitting

  const loadData = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [statusRes, historyRes] = await Promise.all([
        billingAPI.getMyStatus(),
        billingAPI.getHistory(),
      ])
      setStatus(statusRes.data)
      setHistory(parseHistoryList(historyRes.data))
    } catch (error) {
      console.error('Failed to load billing data:', error)
      setLoadError(
        error.response?.data?.detail ||
          'Could not load billing information. Check your connection and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const accessBadge = useMemo(() => {
    if (!status?.access_status) return 'Unknown'
    return status.access_status.replace(/_/g, ' ')
  }, [status])

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    setFormData((prev) => ({ ...prev, proof_image: file || null }))
    if (file) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')

    if (!formData.proof_image) {
      setSubmitError('Please select a payment proof image.')
      return
    }

    const payload = new FormData()
    payload.append('proof_image', formData.proof_image)
    payload.append('transaction_id', formData.transaction_id)
    payload.append('amount', formData.amount)
    payload.append('notes', formData.notes)

    setSubmitting(true)
    try {
      await billingAPI.submitPaymentProof(payload)
      setFormData({
        proof_image: null,
        transaction_id: '',
        amount: MONTHLY_AMOUNT,
        notes: '',
      })
      setPreview('')
      await loadData()
      await fetchUser()
      setSubmitSuccess(
        'Payment proof submitted. An admin will review it and activate your 30-day subscription.'
      )
    } catch (error) {
      console.error('Failed to submit payment proof:', error)
      const data = error.response?.data
      const message =
        data?.detail ||
        data?.proof_image?.[0] ||
        data?.transaction_id?.[0] ||
        data?.amount?.[0] ||
        'Failed to submit payment proof. Please try again.'
      setSubmitError(typeof message === 'string' ? message : JSON.stringify(message))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading fullScreen />

  if (loadError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="max-w-md text-gray-700">{loadError}</p>
        <button type="button" onClick={loadData} className="btn btn-primary">
          Retry
        </button>
      </div>
    )
  }

  const currency = status?.currency || 'ZMW'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Access</h1>
          <p className="text-gray-600">
            Track your trial, subscription, and payment verification status.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-2 text-sm font-medium ${accessBadgeClasses(status?.access_status)}`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>{accessBadge}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Days Remaining</p>
            <p className="text-3xl font-bold text-gray-900">
              {status?.days_remaining ?? 0}
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Trial Ends</p>
            <p className="text-lg font-semibold text-gray-900">
              {status?.trial_end_date
                ? new Date(status.trial_end_date).toLocaleDateString()
                : 'Not provided'}
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Subscription Ends</p>
            <p className="text-lg font-semibold text-gray-900">
              {status?.subscription_end_date
                ? new Date(status.subscription_end_date).toLocaleDateString()
                : 'No active subscription'}
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Expiry Date</p>
            <p className="text-lg font-semibold text-gray-900">
              {status?.expiry_date
                ? new Date(status.expiry_date).toLocaleDateString()
                : 'Not provided'}
            </p>
          </div>
        </Card>
      </div>

      {status?.access_status === 'active_trial' && (
        <Card className="border border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-1 h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-900">Free trial active</h3>
              <p className="text-sm text-yellow-800">
                You have {status.days_remaining ?? 0} day(s) left. After the trial ends, submit
                payment proof (K29.99/month) to continue using Kapita.
              </p>
            </div>
          </div>
        </Card>
      )}

      {status?.access_status === 'active_subscription' && (
        <Card className="border border-green-200 bg-green-50">
          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-1 h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Subscription active</h3>
              <p className="text-sm text-green-800">
                Your subscription is active with {status.days_remaining ?? 0} day(s) remaining.
              </p>
            </div>
          </div>
        </Card>
      )}

      {status?.access_status === 'pending_payment_verification' && (
        <Card className="border border-blue-200 bg-blue-50">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-1 h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Payment under review</h3>
              <p className="text-sm text-blue-800">
                Your payment proof is being reviewed. You will regain full access once an admin
                approves it.
              </p>
            </div>
          </div>
        </Card>
      )}

      {status?.access_status === 'expired' && (
        <Card className="border border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Access expired</h3>
              <p className="text-sm text-red-800">
                Submit payment proof below (K29.99) to request a 30-day subscription after admin
                approval.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Submit Payment Proof
            </h2>
          </div>

          {submitSuccess && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {submitSuccess}
            </div>
          )}
          {submitError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {submitError}
            </div>
          )}

          {hasPendingSubmission && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              You already have a pending submission. Wait for admin review before submitting again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Transaction ID *</label>
              <input
                className="input"
                required
                disabled={!canSubmit}
                value={formData.transaction_id}
                onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Amount ({currency}) *</label>
              <input
                className="input"
                type="number"
                step="0.01"
                required
                disabled={!canSubmit}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-500">
                Monthly plan: K29.99
              </p>
            </div>
            <div>
              <label className="label">Payment Screenshot *</label>
              <input
                className="input"
                type="file"
                accept="image/*"
                disabled={!canSubmit}
                onChange={handleFileChange}
                required={canSubmit}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows="3"
                disabled={!canSubmit}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            {preview && (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <img src={preview} alt="Payment proof preview" className="h-56 w-full object-cover" />
              </div>
            )}
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              <span>
                {submitting
                  ? 'Submitting...'
                  : hasPendingSubmission
                    ? 'Pending review'
                    : status?.access_status !== 'expired'
                      ? 'Available when access expires'
                      : `Submit Proof (${currency})`}
              </span>
            </button>
          </form>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Your Submission History
            </h2>
          </div>
          <div className="space-y-3">
            {history.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
                No payment submissions yet.
              </div>
            )}
            {history.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.transaction_id}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${submissionBadgeClasses(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2">
                  <p>
                    <span className="font-medium">Amount:</span> {currency}{' '}
                    {Number(item.amount).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Reviewed:</span>{' '}
                    {item.reviewed_at ? new Date(item.reviewed_at).toLocaleString() : 'Pending'}
                  </p>
                </div>
                {item.admin_notes && (
                  <p className="mt-3 text-sm text-gray-700">
                    <span className="font-medium">Admin notes:</span> {item.admin_notes}
                  </p>
                )}
                {item.proof_image_url && (
                  <a
                    href={item.proof_image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block overflow-hidden rounded-lg border border-gray-200"
                  >
                    <img src={item.proof_image_url} alt="Proof" className="h-40 w-full object-cover" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
