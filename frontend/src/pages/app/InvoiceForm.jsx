import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { invoicesAPI, currenciesAPI } from '../../services/api'
import Loading from '../../components/Loading'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'

export default function InvoiceForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [currencies, setCurrencies] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    currency: 'ZMW',
    tax_name: '',
    tax_rate: 0,
    discount_name: '',
    discount_amount: 0,
    notes: '',
    terms_conditions: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }],
  })

  useEffect(() => {
    currenciesAPI.getAll().then(res => setCurrencies(res.data)).catch(() => {})
    if (isEditing) {
      invoicesAPI.getOne(id).then(res => {
        const d = res.data
        setForm({
          customer_name: d.customer_name || '',
          customer_email: d.customer_email || '',
          customer_phone: d.customer_phone || '',
          customer_address: d.customer_address || '',
          issue_date: d.issue_date,
          due_date: d.due_date,
          currency: d.currency || 'ZMW',
          tax_name: d.tax_name || '',
          tax_rate: parseFloat(d.tax_rate) || 0,
          discount_name: d.discount_name || '',
          discount_amount: parseFloat(d.discount_amount) || 0,
          notes: d.notes || '',
          terms_conditions: d.terms_conditions || '',
          items: d.items.map(i => ({ description: i.description, quantity: i.quantity, unit_price: parseFloat(i.unit_price) })),
        })
        setLoading(false)
      }).catch(() => { setLoading(false) })
    }
  }, [id, isEditing])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleItemChange = (index, field, value) => {
    const items = [...form.items]
    items[index] = { ...items[index], [field]: field === 'description' ? value : parseFloat(value) || 0 }
    setForm(prev => ({ ...prev, items }))
  }

  const addItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unit_price: 0 }] }))
  }

  const removeItem = (index) => {
    if (form.items.length <= 1) return
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))
  }

  const calcSubtotal = () => form.items.reduce((s, i) => s + (i.quantity * i.unit_price), 0)
  const calcTax = () => (calcSubtotal() * (parseFloat(form.tax_rate) || 0)) / 100
  const calcTotal = () => calcSubtotal() + calcTax() - (parseFloat(form.discount_amount) || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, tax_rate: parseFloat(form.tax_rate) || 0, discount_amount: parseFloat(form.discount_amount) || 0 }
      if (isEditing) {
        await invoicesAPI.update(id, payload)
      } else {
        await invoicesAPI.create(payload)
      }
      navigate('/app/invoices')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save invoice')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/app/invoices')} className="btn btn-secondary p-2">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Invoice' : 'New Invoice'}</h1>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Customer Name *</label>
              <input name="customer_name" value={form.customer_name} onChange={handleChange} required className="input w-full" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="customer_email" type="email" value={form.customer_email} onChange={handleChange} className="input w-full" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="customer_phone" value={form.customer_phone} onChange={handleChange} className="input w-full" />
            </div>
            <div>
              <label className="label">Currency</label>
              <select name="currency" value={form.currency} onChange={handleChange} className="input w-full">
                {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.symbol}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <textarea name="customer_address" value={form.customer_address} onChange={handleChange} rows={2} className="input w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Issue Date</label>
              <input name="issue_date" type="date" value={form.issue_date} onChange={handleChange} className="input w-full" />
            </div>
            <div>
              <label className="label">Due Date *</label>
              <input name="due_date" type="date" value={form.due_date} onChange={handleChange} required className="input w-full" />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Invoice Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-2 font-medium text-gray-600 w-1/2">Description</th>
                  <th className="text-center p-2 font-medium text-gray-600 w-20">Qty</th>
                  <th className="text-right p-2 font-medium text-gray-600 w-32">Unit Price</th>
                  <th className="text-right p-2 font-medium text-gray-600 w-32">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-1">
                      <input value={item.description} onChange={e => handleItemChange(i, 'description', e.target.value)}
                        placeholder="Item description" className="input w-full text-sm" />
                    </td>
                    <td className="p-1">
                      <input type="number" min={1} value={item.quantity}
                        onChange={e => handleItemChange(i, 'quantity', e.target.value)} className="input w-20 text-sm text-center" />
                    </td>
                    <td className="p-1">
                      <input type="number" min={0} step="0.01" value={item.unit_price}
                        onChange={e => handleItemChange(i, 'unit_price', e.target.value)} className="input w-full text-sm text-right" />
                    </td>
                    <td className="p-1 text-right font-medium">
                      {(item.quantity * item.unit_price).toFixed(2)}
                    </td>
                    <td className="p-1">
                      <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addItem} className="btn btn-sm btn-secondary inline-flex items-center gap-1">
            <Plus size={14} /> Add Item
          </button>
        </div>

        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Tax Name</label>
              <input name="tax_name" value={form.tax_name} onChange={handleChange} placeholder="e.g. VAT" className="input w-full" />
            </div>
            <div>
              <label className="label">Tax Rate (%)</label>
              <input name="tax_rate" type="number" min={0} max={100} step="0.01" value={form.tax_rate} onChange={handleChange} className="input w-full" />
            </div>
            <div>
              <label className="label">Discount Name</label>
              <input name="discount_name" value={form.discount_name} onChange={handleChange} placeholder="e.g. Volume discount" className="input w-full" />
            </div>
            <div>
              <label className="label">Discount Amount ({form.currency})</label>
              <input name="discount_amount" type="number" min={0} step="0.01" value={form.discount_amount} onChange={handleChange} className="input w-full" />
            </div>
          </div>
          <div className="border-t pt-4 space-y-1 text-right text-sm">
            <p>Subtotal: <span className="font-semibold">{calcSubtotal().toFixed(2)}</span></p>
            {form.tax_rate > 0 && <p>Tax ({form.tax_rate}%): <span className="font-semibold">{calcTax().toFixed(2)}</span></p>}
            {form.discount_amount > 0 && <p>Discount: <span className="font-semibold">-{parseFloat(form.discount_amount).toFixed(2)}</span></p>}
            <p className="text-lg font-bold text-emerald-600">Total: {calcTotal().toFixed(2)} {form.currency}</p>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <label className="label">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="input w-full" placeholder="Optional notes for the customer" />
          </div>
          <div>
            <label className="label">Terms & Conditions</label>
            <textarea name="terms_conditions" value={form.terms_conditions} onChange={handleChange} rows={2} className="input w-full" placeholder="Payment terms, warranty, etc." />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate('/app/invoices')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn btn-primary inline-flex items-center gap-2">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </form>
    </div>
  )
}
