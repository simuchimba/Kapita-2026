import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Tag, Percent, ScanLine, Camera, Zap, ShoppingCart, X, Search, Check } from 'lucide-react'
import Card from '../components/Card'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import BarcodeScanner from '../components/BarcodeScanner'
import { salesAPI, productsAPI, customersAPI, promotionsAPI, barcodeAPI } from '../services/api'

export default function Sales() {
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [activePromotions, setActivePromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFullForm, setShowFullForm] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [saleLoading, setSaleLoading] = useState(false)
  const [scanSuccess, setScanSuccess] = useState('')
  const qtyRef = useRef(null)
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', email: '', address: '' })
  const [formData, setFormData] = useState({
    product: '', customer: '', quantity: '1', unit_price: '',
    payment_type: 'cash', deposit_amount: '0', due_date: '', notes: '',
    discount_type: 'none', discount_value: '0', promotion_name: '', selected_promotion: '',
  })
  const [manualBarcode, setManualBarcode] = useState('')
  const [searching, setSearching] = useState(false)

  const buildSalePayload = () => ({
    product: Number(formData.product),
    customer: formData.customer ? Number(formData.customer) : null,
    quantity: Number(formData.quantity),
    unit_price: Number(formData.unit_price),
    payment_type: formData.payment_type,
    deposit_amount: formData.payment_type === 'credit' ? Number(formData.deposit_amount || 0) : 0,
    due_date: formData.payment_type === 'credit' && formData.due_date ? formData.due_date : null,
    notes: formData.notes?.trim() || '',
    discount_type: formData.discount_type || 'none',
    discount_value: Number(formData.discount_value || 0),
    promotion_name: formData.promotion_name || '',
  })

  const getErrorMessage = (error) => {
    const data = error.response?.data
    if (!data) return 'Failed to create sale'
    if (typeof data.detail === 'string') return data.detail
    const fieldMessages = Object.entries(data)
      .map(([key, value]) => {
        if (Array.isArray(value)) return `${key}: ${value.join(', ')}`
        if (typeof value === 'string') return `${key}: ${value}`
        return null
      }).filter(Boolean)
    return fieldMessages.length > 0 ? fieldMessages.join(' | ') : 'Failed to create sale'
  }

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [salesRes, productsRes, customersRes, promotionsRes] = await Promise.all([
        salesAPI.getAll(),
        productsAPI.getAll(),
        customersAPI.getAll(),
        promotionsAPI.getActive(),
      ])
      setSales(salesRes.data.results || salesRes.data)
      setProducts(productsRes.data.results || productsRes.data)
      setCustomers(customersRes.data.results || customersRes.data)
      setActivePromotions(promotionsRes.data || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBarcodeResult = useCallback((product) => {
    if (product && product.id) {
      setFormData(prev => ({
        ...prev, product: product.id, unit_price: product.selling_price || prev.unit_price, quantity: '1',
      }))
      setManualBarcode('')
      setScanSuccess(`Scanned: ${product.name} — ${product.currency || 'ZMW'} ${parseFloat(product.selling_price || 0).toFixed(2)}`)
      setTimeout(() => setScanSuccess(''), 5000)
      setTimeout(() => qtyRef.current?.focus(), 200)
    }
  }, [])

  const handleManualBarcode = async () => {
    const code = manualBarcode.trim()
    if (!code) return
    setSearching(true)
    try {
      const res = await barcodeAPI.lookup(code)
      if (res.data) {
        handleBarcodeResult(res.data)
        return
      }
    } catch {}
    try {
      const res = await productsAPI.getAll({ search: code })
      const items = res.data.results || res.data
      if (items?.length > 0) {
        handleBarcodeResult(items[0])
        return
      }
    } catch {}
    alert(`No product found with barcode: ${code}`)
    setSearching(false)
  }

  const handleQuickSale = async () => {
    if (!formData.product || !formData.quantity) return
    setSaleLoading(true)
    try {
      await salesAPI.create(buildSalePayload())
      setScanSuccess('Sale completed!')
      setTimeout(() => setScanSuccess(''), 4000)
      setFormData(prev => ({
        ...prev, product: '', quantity: '1', unit_price: '',
        discount_type: 'none', discount_value: '0', promotion_name: '', selected_promotion: '',
      }))
      fetchData()
    } catch (error) {
      alert(getErrorMessage(error))
    } finally {
      setSaleLoading(false)
    }
  }

  const handleFullSubmit = async (e) => {
    e.preventDefault()
    setSaleLoading(true)
    try {
      await salesAPI.create(buildSalePayload())
      setShowFullForm(false)
      resetForm()
      fetchData()
    } catch (error) {
      alert(getErrorMessage(error))
    } finally {
      setSaleLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      product: '', customer: '', quantity: '1', unit_price: '',
      payment_type: 'cash', deposit_amount: '0', due_date: '', notes: '',
      discount_type: 'none', discount_value: '0', promotion_name: '', selected_promotion: '',
    })
    setShowAddCustomer(false)
    setNewCustomerData({ name: '', phone: '', email: '', address: '' })
    setManualBarcode('')
  }

  const handleAddNewCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.phone) {
      alert('Please enter customer name and phone number')
      return
    }
    try {
      const response = await customersAPI.create(newCustomerData)
      setCustomers([...customers, response.data])
      setFormData({ ...formData, customer: response.data.id })
      setNewCustomerData({ name: '', phone: '', email: '', address: '' })
      setShowAddCustomer(false)
      alert('Customer added successfully!')
    } catch (error) {
      alert(error.response?.data?.name?.[0] || error.response?.data?.phone?.[0] || 'Failed to add customer')
    }
  }

  const calculateTotals = () => {
    const quantity = parseFloat(formData.quantity) || 0
    const unitPrice = parseFloat(formData.unit_price) || 0
    const subtotal = quantity * unitPrice
    let discountAmount = 0
    if (formData.discount_type === 'percentage') {
      discountAmount = (subtotal * parseFloat(formData.discount_value || 0)) / 100
    } else if (formData.discount_type === 'fixed') {
      discountAmount = Math.min(parseFloat(formData.discount_value || 0), subtotal)
    }
    return { subtotal, discountAmount, total: subtotal - discountAmount }
  }

  const scannedProduct = formData.product
    ? products.find(p => p.id === parseInt(formData.product))
    : null

  const columns = [
    { header: 'Date', render: (row) => new Date(row.created_at).toLocaleDateString() },
    { header: 'Product', render: (row) => row.product_details?.name || 'N/A' },
    { header: 'Customer', render: (row) => row.customer_details?.name || 'Walk-in' },
    { header: 'Quantity', accessor: 'quantity' },
    {
      header: 'Total',
      render: (row) => (
        <div>
          <p className="font-medium">ZMW {parseFloat(row.total_amount).toLocaleString()}</p>
          {row.discount_amount > 0 && (
            <p className="text-xs text-green-600">-K{parseFloat(row.discount_amount).toFixed(2)}</p>
          )}
        </div>
      )
    },
    { header: 'Profit', render: (row) => `ZMW ${parseFloat(row.profit).toLocaleString()}` },
    {
      header: 'Payment',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.payment_type === 'cash' ? 'bg-green-100 text-green-800' :
          row.payment_type === 'mobile_money' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row.payment_type.replace('_', ' ')}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <button onClick={() => downloadReceipt(row.id)} className="btn btn-sm btn-outline">Receipt</button>
      )
    },
  ]

  const downloadReceipt = async (id) => {
    try {
      const res = await salesAPI.getReceipt(id)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = `receipt_${id}.pdf`
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url)
    } catch { alert('Failed to download receipt') }
  }

  if (loading) return <Loading fullScreen />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600">Scan barcodes to sell instantly</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFullForm(true)} className="btn btn-secondary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {scanSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-sm flex items-center gap-2">
          <Check size={18} />
          {scanSuccess}
        </div>
      )}

      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Zap size={20} className="text-emerald-600" />
            Quick Scan & Sell
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Scan a barcode with your camera</p>
              <BarcodeScanner onProductFound={handleBarcodeResult} />
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-500">Or type a barcode number</p>
              <div className="flex gap-2">
                <input
                  type="text" value={manualBarcode}
                  onChange={e => setManualBarcode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualBarcode()}
                  placeholder="Enter barcode..."
                  className="input flex-1 font-mono"
                />
                <button onClick={handleManualBarcode} disabled={searching} className="btn btn-primary">
                  <Search size={18} />
                </button>
              </div>
              {!scannedProduct && (
                <div className="flex gap-1 flex-wrap">
                  {products.filter(p => p.barcode).slice(0, 4).map(p => (
                    <button key={p.id} type="button"
                      onClick={() => handleBarcodeResult(p)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 text-gray-600">
                      {p.barcode}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {scannedProduct && (
            <div className="border-t pt-4 space-y-3">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-lg text-gray-900">{scannedProduct.name}</p>
                    <p className="text-sm text-gray-500">
                      SKU: {scannedProduct.sku} | Barcode: {scannedProduct.barcode || '-'} | Stock: {scannedProduct.quantity}
                    </p>
                    <p className="text-lg font-bold text-emerald-700 mt-1">
                      {scannedProduct.currency || 'ZMW'} {parseFloat(scannedProduct.selling_price).toFixed(2)}
                    </p>
                  </div>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, product: '', unit_price: '' }))}
                    className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                    <X size={14} /> Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label">Quantity</label>
                  <input ref={qtyRef} type="number" min="1" required
                    className="input text-lg font-bold"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    onFocus={e => e.target.select()} />
                </div>
                <div>
                  <label className="label">Unit Price ({scannedProduct.currency || 'ZMW'})</label>
                  <input type="number" step="0.01" required className="input"
                    value={formData.unit_price}
                    onChange={e => setFormData({ ...formData, unit_price: e.target.value })} />
                </div>
                <div>
                  <label className="label">Payment</label>
                  <select className="input" value={formData.payment_type}
                    onChange={e => setFormData({ ...formData, payment_type: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              </div>

              {formData.payment_type === 'credit' && (
                <div className="space-y-3">
                  <div>
                    <label className="label">Customer *</label>
                    <select required className="input" value={formData.customer}
                      onChange={e => setFormData({ ...formData, customer: e.target.value })}>
                      <option value="">Select customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      <button type="button" onClick={() => setShowAddCustomer(true)}
                        className="text-emerald-600 hover:underline">+ Add new customer</button>
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Deposit</label>
                      <input type="number" step="0.01" className="input" value={formData.deposit_amount}
                        onChange={e => setFormData({ ...formData, deposit_amount: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Due Date</label>
                      <input type="date" className="input" value={formData.due_date}
                        onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center bg-primary-50 p-4 rounded-lg border border-primary-200">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {scannedProduct.currency || 'ZMW'} {calculateTotals().total.toLocaleString()}
                  </p>
                  {formData.discount_type !== 'none' && calculateTotals().discountAmount > 0 && (
                    <p className="text-xs text-green-600">-{calculateTotals().discountAmount.toFixed(2)} discount</p>
                  )}
                </div>
                <button onClick={handleQuickSale} disabled={saleLoading}
                  className="btn btn-primary py-3 px-8 text-lg font-bold inline-flex items-center gap-2">
                  <Zap size={20} />
                  {saleLoading ? 'Selling...' : 'Complete Sale'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={sales} />
      </Card>

      <Modal isOpen={showFullForm} onClose={() => { setShowFullForm(false); resetForm() }}
        title="Record New Sale" size="lg">
        <form onSubmit={handleFullSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Product *</label>
              <select required className="input" value={formData.product}
                onChange={e => {
                  const p = products.find(x => x.id === parseInt(e.target.value))
                  setFormData({ ...formData, product: e.target.value, unit_price: p ? p.selling_price : '' })
                }}>
                <option value="">Select product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.barcode ? `(${p.barcode})` : ''} - Stock: {p.quantity}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Customer</label>
              <select className="input" value={formData.customer}
                onChange={e => setFormData({ ...formData, customer: e.target.value })}>
                <option value="">Walk-in customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Quantity *</label>
              <input type="number" min="1" required className="input" value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
            </div>
            <div>
              <label className="label">Unit Price</label>
              <input type="number" step="0.01" required className="input" value={formData.unit_price}
                onChange={e => setFormData({ ...formData, unit_price: e.target.value })} />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold">Discount / Promotion</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Promotion</label>
                <select className="input" value={formData.selected_promotion}
                  onChange={e => {
                    if (!e.target.value) {
                      setFormData({ ...formData, selected_promotion: '', discount_type: 'none', discount_value: '0', promotion_name: '' })
                      return
                    }
                    const promo = activePromotions.find(p => p.id === parseInt(e.target.value))
                    if (promo) setFormData({ ...formData, selected_promotion: e.target.value, discount_type: promo.discount_type, discount_value: promo.discount_value, promotion_name: promo.name })
                  }}>
                  <option value="">No promotion</option>
                  {activePromotions.filter(p => p.apply_to_all_products || (formData.product && p.product_ids?.includes(parseInt(formData.product))))
                    .map(promo => (
                      <option key={promo.id} value={promo.id}>
                        {promo.name} ({promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `K${promo.discount_value}`})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="label">Manual Discount</label>
                <select className="input" value={formData.discount_type}
                  onChange={e => setFormData({ ...formData, discount_type: e.target.value, selected_promotion: '', promotion_name: '' })}
                  disabled={formData.selected_promotion}>
                  <option value="none">None</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (K)</option>
                </select>
              </div>
              {formData.discount_type !== 'none' && !formData.selected_promotion && (
                <>
                  <div>
                    <label className="label">Value</label>
                    <input type="number" step="0.01" className="input" value={formData.discount_value}
                      onChange={e => setFormData({ ...formData, discount_value: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Reason</label>
                    <input type="text" className="input" value={formData.promotion_name}
                      onChange={e => setFormData({ ...formData, promotion_name: e.target.value })} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Payment *</label>
              <select className="input" value={formData.payment_type}
                onChange={e => setFormData({ ...formData, payment_type: e.target.value })}>
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            {formData.payment_type === 'credit' && (
              <div>
                <label className="label">Due Date</label>
                <input type="date" className="input" value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
              </div>
            )}
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows="2" value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })} />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setShowFullForm(false); resetForm() }} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saleLoading} className="btn btn-primary">
              {saleLoading ? 'Saving...' : 'Record Sale'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
