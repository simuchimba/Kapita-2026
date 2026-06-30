import { useState, useEffect } from 'react'
import { currenciesAPI } from '../../services/api'
import Loading from '../../components/Loading'
import { Plus, Trash2, Save } from 'lucide-react'

export default function Currencies() {
  const [currencies, setCurrencies] = useState([])
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ base_currency: 'ZMW', target_currency: 'USD', rate: '' })
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [convertForm, setConvertForm] = useState({ amount: 1, from: 'ZMW', to: 'USD' })
  const [convertResult, setConvertResult] = useState(null)

  const loadData = async () => {
    try {
      const [curRes, rateRes] = await Promise.all([currenciesAPI.getAll(), currenciesAPI.getRates()])
      setCurrencies(curRes.data)
      setRates(rateRes.data)
    } catch { }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editId) {
        await currenciesAPI.updateRate(editId, form)
      } else {
        await currenciesAPI.createRate(form)
      }
      setShowForm(false)
      setEditId(null)
      setForm({ base_currency: 'ZMW', target_currency: 'USD', rate: '' })
      loadData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error saving rate')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this exchange rate?')) return
    try {
      await currenciesAPI.deleteRate(id)
      loadData()
    } catch { }
  }

  const handleEdit = (rate) => {
    setForm({ base_currency: rate.base_currency, target_currency: rate.target_currency, rate: rate.rate })
    setEditId(rate.id)
    setShowForm(true)
  }

  const handleConvert = async () => {
    try {
      const res = await currenciesAPI.convert(convertForm)
      setConvertResult(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Conversion failed')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Currencies & Exchange Rates</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ base_currency: 'ZMW', target_currency: 'USD', rate: '' }) }}
          className="btn btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Add Rate
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-4 space-y-3">
          <h3 className="font-semibold">{editId ? 'Edit' : 'Add'} Exchange Rate</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">From</label>
              <select value={form.base_currency} onChange={e => setForm(p => ({ ...p, base_currency: e.target.value }))} className="input w-full">
                {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
            <div>
              <label className="label">To</label>
              <select value={form.target_currency} onChange={e => setForm(p => ({ ...p, target_currency: e.target.value }))} className="input w-full">
                {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Rate</label>
              <input type="number" step="0.000001" min="0" value={form.rate} required
                onChange={e => setForm(p => ({ ...p, rate: e.target.value }))} className="input w-full" placeholder="e.g. 21.50" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary inline-flex items-center gap-1"><Save size={16} /> Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="card p-4 space-y-3">
        <h3 className="font-semibold">Currency Converter</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="label">Amount</label>
            <input type="number" min="0" step="0.01" value={convertForm.amount}
              onChange={e => setConvertForm(p => ({ ...p, amount: e.target.value }))} className="input w-full" />
          </div>
          <div>
            <label className="label">From</label>
            <select value={convertForm.from} onChange={e => setConvertForm(p => ({ ...p, from: e.target.value }))} className="input w-full">
              {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
          <div>
            <label className="label">To</label>
            <select value={convertForm.to} onChange={e => setConvertForm(p => ({ ...p, to: e.target.value }))} className="input w-full">
              {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
          <button onClick={handleConvert} className="btn btn-primary">Convert</button>
        </div>
        {convertResult && (
          <div className="p-3 bg-emerald-50 rounded-lg text-sm">
            {convertResult.amount} {convertResult.to} (Rate: 1 {convertResult.from} = {convertResult.rate} {convertResult.to})
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-3 font-medium">Base Currency</th>
                <th className="text-left p-3 font-medium">Target Currency</th>
                <th className="text-right p-3 font-medium">Rate</th>
                <th className="text-right p-3 font-medium">Last Updated</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.length === 0 && (
                <tr><td colSpan={5} className="text-center p-6 text-gray-400">No exchange rates configured</td></tr>
              )}
              {rates.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{r.base_currency_name} ({r.base_currency})</td>
                  <td className="p-3">{r.target_currency_name} ({r.target_currency})</td>
                  <td className="p-3 text-right font-medium">{parseFloat(r.rate).toFixed(6)}</td>
                  <td className="p-3 text-right text-gray-500">{r.updated_at}</td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleEdit(r)} className="btn btn-sm btn-secondary p-1.5">Edit</button>
                      <button onClick={() => handleDelete(r.id)} className="btn btn-sm btn-danger p-1.5"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-2">Available Currencies</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {currencies.map(c => (
            <div key={c.code} className="p-2 border rounded text-sm flex justify-between items-center">
              <span><span className="font-bold">{c.code}</span> - {c.symbol}</span>
              {c.is_base && <span className="badge badge-green text-xs">Base</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
