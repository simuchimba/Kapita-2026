import { useState, useEffect, useRef } from 'react'
import { MessageSquarePlus, X, Star, ChevronDown, Send, CheckCircle2 } from 'lucide-react'
import { feedbackAPI } from '../services/api'
import { useLocation } from 'react-router-dom'

const CATEGORIES = [
  { value: 'bug', label: '🐛 Bug Report' },
  { value: 'feature', label: '✨ Feature Request' },
  { value: 'ux', label: '🎨 User Experience' },
  { value: 'performance', label: '⚡ Performance' },
  { value: 'general', label: '💬 General' },
]

const EMPTY = { category: 'general', rating: 0, title: '', message: '' }

export default function FeedbackPanel() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef(null)
  const location = useLocation()

  // close on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  // close on outside click
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) {
      setError('Title and message are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await feedbackAPI.submit({
        ...form,
        rating: form.rating || null,
        page: location.pathname,
      })
      setSubmitted(true)
      setForm(EMPTY)
      // auto-close after 2.5s
      setTimeout(() => { setSubmitted(false); setOpen(false) }, 2500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Trigger button — lives at the bottom of the sidebar */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="h-5 w-5 shrink-0" />
        <span>Send Feedback</span>
      </button>

      {/* Slide-out panel */}
      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-4 left-4 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white shadow-2xl lg:left-[17rem]"
          style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-emerald-600" />
              <h2 className="text-sm font-semibold text-gray-900">Beta Feedback</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="text-sm font-semibold text-gray-900">Thank you for your feedback!</p>
                <p className="text-xs text-gray-500">Your response has been recorded and will help improve Kapita.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
                )}

                {/* Category */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">Category</label>
                  <div className="relative">
                    <select
                      className="input appearance-none pr-8 text-sm"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Star rating */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Overall rating <span className="text-gray-400">(optional)</span>
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm({ ...form, rating: n === form.rating ? 0 : n })}
                        className="focus:outline-none"
                        aria-label={`${n} star`}
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            n <= form.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Short title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    className="input text-sm"
                    placeholder="Summarise your feedback"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="input resize-none text-sm"
                    placeholder="Describe the issue or idea in detail…"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>

                <p className="text-xs text-gray-400">
                  Page: <span className="text-gray-500">{location.pathname}</span>
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex w-full items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {loading ? 'Submitting…' : 'Submit Feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
