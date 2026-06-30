import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Tag, Percent, ScanLine, Camera } from 'lucide-react'
import Card from '../components/Card'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import BarcodeScanner from '../components/BarcodeScanner'
import { salesAPI, productsAPI, customersAPI, promotionsAPI } from '../services/api'

export default function Sales() {
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [activePromotions, setActivePromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({
    name: '', phone: '', email: '', address: '',
  })
  const [formData, setFormData] = useState({
    product: '', customer: '', quantity: '', unit_price: '',
    payment_type: 'cash', deposit_amount: '0', due_date: '', notes: '',
    discount_type: 'none', discount_value: '0', promotion_name: '', selected_promotion: '',
  })

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
      })
      .filter(Boolean)
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

  const handleScannerResult = useCallback((product) => {
    setShowScanner(false)
    if (product && product.id) {
      setFormData(prev => ({
        ...prev,
        product: product.id,
        unit_price: product.selling_price || prev.unit_price,
      }))
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await salesAPI.create(buildSalePayload())
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Failed to create sale:', error)
      alert(getErrorMessage(error))
    }
  }

  const resetForm = () => {
    setFormData({
      product: '', customer: '', quantity: '', unit_price: '',
      payment_type: 'cash', deposit_amount: '0', due_date: '', notes: '',
      discount_type: 'none', discount_value: '0', promotion_name: '', selected_promotion: '',
    })
    setShowAddCustomer(false)
    setNewCustomerData({ name: '', phone: '', email: '', address: '' })
  }

  const handleAddNewCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.phone) {
      alert('Please enter customer name and phone number')
      return
    }
    try {
      const response = await customersAPI.create(newCustomerData)
      const newCustomer = response.data
      setCustomers([...customers, newCustomer])
      setFormData({ ...formData, customer: newCustomer.id })
      setNewCustomerData({ name: '', phone: '', email: '', address: '' })
      setShowAddCustomer(false)
      alert('Customer added successfully!')
    } catch (error) {
      console.error('Failed to add customer:', error)
      const errorMsg = error.response?.data?.name?.[0] || error.response?.data?.phone?.[0] || 'Failed to add customer'
      alert(errorMsg)
    }
  }

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === parseInt(productId))
    setFormData({
      ...formData,
      product: productId,
      unit_price: product ? product.selling_price : '',
    })
  }

  const handlePromotionChange = (promotionId) => {
    if (!promotionId) {
      setFormData({ ...formData, selected_promotion: '', discount_type: 'none', discount_value: '0', promotion_name: '' })
      return
    }
    const promotion = activePromotions.find(p => p.id === parseInt(promotionId))
    if (promotion) {
      setFormData({
        ...formData,
        selected_promotion: promotionId,
        discount_type: promotion.discount_type,
        discount_value: promotion.discount_value,
        promotion_name: promotion.name,
      })
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
    const total = subtotal - discountAmount
    return { subtotal, discountAmount, total }
  }

  const columns = [
    { header: 'Date', render: (row) => new Date(row.created_at).toLocaleDateString() },
    { header: 'Product', render: (row) => row.product_details?.name || 'N/A' },
    { header: 'Customer', render: (row) => row.customer_details?.name || 'Walk-in' },
    { header: 'Quantity', accessor: 'quantity' },
    {
      header: 'Total Amount',
      render: (row) => (
        <div>
          <p className="font-medium">ZMW {parseFloat(row.total_amount).toLocaleString()}</p>
          {row.discount_amount > 0 && (
            <p className="text-xs text-green-600 flex items-center space-x-1">
              <Percent className="w-3 h-3" />
              <span>-K{parseFloat(row.discount_amount).toFixed(2)} discount</span>
            </p>
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
        <button onClick={() => downloadReceipt(row.id)} className="btn btn-sm btn-outline">
          Download PDF receipt!
        </button>
      )
    },
  ]

  const downloadReceipt = async (id) => {
    try {
      const res = await salesAPI.getReceipt(id)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt_${id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download receipt', error)
      alert('Failed to download receipt')
    }
  }

  if (loading) return <Loading fullScreen />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600">Track all your sales transactions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>New Sale</span>
        </button>
      </div>

      <Card>
        <Table columns={columns} data={sales} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm() }}
        title="Record New Sale" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Product *</label>
                <button type="button" onClick={() => setShowScanner(true)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                  <ScanLine className="w-3 h-3" /> Scan Barcode
                </button>
              </div>
              <select required className="input" value={formData.product}
                onChange={(e) => handleProductChange(e.target.value)}>
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.barcode ? `(${product.barcode})` : ''} - Stock: {product.quantity}
                  </option>
                ))}
              </select>
            </div>

            {showScanner && (
              <div className="md:col-span-2">
                <BarcodeScanner
                  onProductFound={handleScannerResult}
                  onClose={() => setShowScanner(false)}
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Customer</label>
                <button type="button" onClick={() => setShowAddCustomer(!showAddCustomer)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1">
                  <Plus className="w-3 h-3" />
                  <span>{showAddCustomer ? 'Cancel' : 'Add New'}</span>
                </button>
              </div>
              {showAddCustomer ? (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="label text-xs">Customer Name *</label>
                    <input type="text" className="input" placeholder="Enter customer name"
                      value={newCustomerData.name}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label text-xs">Phone Number *</label>
                    <input type="tel" className="input" placeholder="Enter phone number"
                      value={newCustomerData.phone}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="label text-xs">Email (Optional)</label>
                    <input type="email" className="input" placeholder="Enter email"
                      value={newCustomerData.email}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="label text-xs">Address (Optional)</label>
                    <input type="text" className="input" placeholder="Enter address"
                      value={newCustomerData.address}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })} />
                  </div>
                  <button type="button" onClick={handleAddNewCustomer} className="btn btn-primary w-full text-sm">
                    Add Customer
                  </button>
                </div>
              ) : (
                <select className="input" value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}>
                  <option value="">Walk-in customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="label">Quantity *</label>
              <input type="number" required min="1" className="input"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
            </div>

            <div>
              <label className="label">Unit Price *</label>
              <input type="number" step="0.01" required className="input"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })} />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Tag className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Apply Discount or Promotion</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Select Promotion (Optional)</label>
                <select className="input" value={formData.selected_promotion}
                  onChange={(e) => handlePromotionChange(e.target.value)}>
                  <option value="">No promotion</option>
                  {activePromotions
                    .filter(promo =>
                      promo.apply_to_all_products ||
                      (formData.product && promo.product_ids?.includes(parseInt(formData.product)))
                    )
                    .map((promo) => (
                      <option key={promo.id} value={promo.id}>
                        {promo.name} ({promo.discount_type === 'percentage'
                          ? `${promo.discount_value}%`
                          : `K${promo.discount_value}`} off)
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="label">Or Manual Discount Type</label>
                <select className="input" value={formData.discount_type}
                  onChange={(e) => setFormData({
                    ...formData, discount_type: e.target.value,
                    selected_promotion: '', promotion_name: '',
                  })}
                  disabled={formData.selected_promotion}>
                  <option value="none">No Discount</option>
                  <option value="percentage">Percentage Off (%)</option>
                  <option value="fixed">Fixed Amount (K)</option>
                </select>
              </div>
              {formData.discount_type !== 'none' && !formData.selected_promotion && (
                <div>
                  <label className="label">Discount Value</label>
                  <input type="number" step="0.01" min="0"
                    max={formData.discount_type === 'percentage' ? '100' : undefined}
                    className="input" value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === 'percentage' ? '0-100' : 'Amount'} />
                </div>
              )}
              {formData.discount_type !== 'none' && !formData.selected_promotion && (
                <div>
                  <label className="label">Discount Reason (Optional)</label>
                  <input type="text" className="input" value={formData.promotion_name}
                    onChange={(e) => setFormData({ ...formData, promotion_name: e.target.value })}
                    placeholder="e.g., Loyal customer, Clearance" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Payment Type *</label>
              <select required className="input" value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}>
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            {formData.payment_type === 'credit' && (
              <>
                <div>
                  <label className="label">Deposit Amount</label>
                  <input type="number" step="0.01" className="input" value={formData.deposit_amount}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })} />
                </div>
                <div>
                  <label className="label">Due Date *</label>
                  <input type="date" required className="input" value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                </div>
              </>
            )}
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows="2" value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>

          {formData.quantity && formData.unit_price && (
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">ZMW {calculateTotals().subtotal.toLocaleString()}</span>
                </div>
                {formData.discount_type !== 'none' && calculateTotals().discountAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 flex items-center space-x-1">
                        <Percent className="w-4 h-4" />
                        <span>Discount:</span>
                      </span>
                      <span className="font-medium text-green-600">
                        -ZMW {calculateTotals().discountAmount.toLocaleString()}
                      </span>
                    </div>
                    {formData.promotion_name && (
                      <p className="text-xs text-gray-500 italic">"{formData.promotion_name}"</p>
                    )}
                  </>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-primary-200 pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-primary-600">ZMW {calculateTotals().total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Record Sale</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
