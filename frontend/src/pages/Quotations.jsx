import { useEffect, useState } from 'react'
import { Plus, Download, Edit, Trash2, Save } from 'lucide-react'
import Card from '../components/Card'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import { quotationsAPI, customersAPI } from '../services/api'

export default function Quotations() {
  const [quotations, setQuotations] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingQuotation, setEditingQuotation] = useState(null)
  const [formData, setFormData] = useState({
    customer: '',
    subject: '',
    introduction: '',
    vat_percentage: '0',
    delivery_period: '',
    payment_terms: '',
    warranty: '',
    validity_period: '',
    terms_and_conditions: '',
    notes: '',
    status: 'draft',
    items: [
      { description: '', quantity: '1', unit_price: '0' }
    ]
  })

  const getErrorMessage = (error) => {
    const data = error.response?.data
    if (!data) return 'Failed to save quotation'
    if (typeof data === 'string') return 'Failed to save quotation'
    if (typeof data.detail === 'string') return data.detail
    const fieldMessages = Object.entries(data)
      .map(([key, value]) => {
        if (Array.isArray(value)) return `${key}: ${value.join(', ')}`
        if (typeof value === 'string') return `${key}: ${value}`
        return null
      }).filter(Boolean)
    return fieldMessages.length > 0 ? fieldMessages.join(' | ') : 'Failed to save quotation'
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [quotationsRes, customersRes] = await Promise.all([
        quotationsAPI.getAll(),
        customersAPI.getAll()
      ])
      setQuotations(quotationsRes.data.results || quotationsRes.data)
      setCustomers(customersRes.data.results || customersRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e, saveAsDraft = false) => {
    e.preventDefault()
    try {
      const data = {
        customer: formData.customer ? Number(formData.customer) : null,
        subject: formData.subject,
        introduction: formData.introduction,
        vat_percentage: Number(formData.vat_percentage),
        delivery_period: formData.delivery_period,
        payment_terms: formData.payment_terms,
        warranty: formData.warranty,
        validity_period: formData.validity_period,
        terms_and_conditions: formData.terms_and_conditions,
        notes: formData.notes,
        status: saveAsDraft ? 'draft' : formData.status,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price)
        }))
      }
      
      if (editingQuotation) {
        await quotationsAPI.update(editingQuotation.id, data)
      } else {
        await quotationsAPI.create(data)
      }
      
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Failed to save quotation:', error)
      alert(getErrorMessage(error))
    }
  }

  const handleEdit = (quotation) => {
    setEditingQuotation(quotation)
    setFormData({
      customer: quotation.customer ? quotation.customer.id : '',
      subject: quotation.subject,
      introduction: quotation.introduction || '',
      vat_percentage: String(quotation.vat_percentage),
      delivery_period: quotation.delivery_period || '',
      payment_terms: quotation.payment_terms || '',
      warranty: quotation.warranty || '',
      validity_period: quotation.validity_period || '',
      terms_and_conditions: quotation.terms_and_conditions || '',
      notes: quotation.notes || '',
      status: quotation.status,
      items: quotation.items.map(item => ({
        description: item.description,
        quantity: String(item.quantity),
        unit_price: String(item.unit_price)
      }))
    })
    setShowModal(true)
  }

  const handleDelete = async (quotationId) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return
    try {
      await quotationsAPI.delete(quotationId)
      fetchData()
    } catch (error) {
      console.error('Failed to delete quotation:', error)
      alert('Failed to delete quotation')
    }
  }

  const resetForm = () => {
    setEditingQuotation(null)
    setFormData({
      customer: '',
      subject: '',
      introduction: '',
      vat_percentage: '0',
      delivery_period: '',
      payment_terms: '',
      warranty: '',
      validity_period: '',
      terms_and_conditions: '',
      notes: '',
      status: 'draft',
      items: [
        { description: '', quantity: '1', unit_price: '0' }
      ]
    })
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: '1', unit_price: '0' }]
    })
  }

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0),
      0
    )
    const vatAmount = (subtotal * parseFloat(formData.vat_percentage || 0)) / 100
    const total = subtotal + vatAmount
    return { subtotal, vatAmount, total }
  }

  const columns = [
    {
      header: 'Date',
      render: (row) => new Date(row.created_at).toLocaleDateString()
    },
    {
      header: 'Quotation #',
      accessor: 'quotation_number'
    },
    {
      header: 'Subject',
      accessor: 'subject'
    },
    {
      header: 'Customer',
      render: (row) => row.customer_details?.name || 'N/A'
    },
    {
      header: 'Total Amount',
      render: (row) => `ZMW ${parseFloat(row.total_amount).toLocaleString()}`
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.status === 'draft' ? 'bg-gray-100 text-gray-800' :
          row.status === 'sent' ? 'bg-blue-100 text-blue-800' :
          row.status === 'accepted' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => downloadPDF(row.id)}
            className="btn btn-sm btn-outline flex items-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="btn btn-sm btn-outline flex items-center space-x-1"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="btn btn-sm btn-outline text-red-600 border-red-200 hover:bg-red-50 flex items-center space-x-1"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )
    },
  ]

  const downloadPDF = async (id) => {
    try {
      const res = await quotationsAPI.getPDF(id)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `quotation_${id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download PDF', error)
      alert('Failed to download PDF')
    }
  }

  if (loading) return <Loading fullScreen />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600">Create and manage professional quotations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Quotation</span>
        </button>
      </div>

      {/* Quotations Table */}
      <Card>
        <Table columns={columns} data={quotations} />
      </Card>

      {/* Add/Edit Quotation Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingQuotation ? 'Edit Quotation' : 'Create New Quotation'}
        size="xl"
      >
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Customer</label>
              <select
                className="input"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Subject *</label>
              <input
                type="text"
                required
                className="input"
                placeholder="Quotation subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="label">Introduction</label>
            <textarea
              className="input"
              rows="2"
              placeholder="Introduction text"
              value={formData.introduction}
              onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
            />
          </div>

          {/* Items */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="btn btn-sm btn-outline flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 mb-3 items-end">
                <div className="col-span-6">
                  <label className="label text-xs">Description *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="label text-xs">Quantity *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    className="input"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <label className="label text-xs">Unit Price *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    className="input"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                  />
                </div>
                {formData.items.length > 1 && (
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="btn btn-sm btn-outline text-red-600 border-red-200 hover:bg-red-50"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">VAT Percentage (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={formData.vat_percentage}
                onChange={(e) => setFormData({ ...formData, vat_percentage: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Delivery Period</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., 7 business days"
                value={formData.delivery_period}
                onChange={(e) => setFormData({ ...formData, delivery_period: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Payment Terms</label>
            <textarea
              className="input"
              rows="2"
              placeholder="Payment terms and conditions"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Warranty</label>
              <input
                type="text"
                className="input"
                placeholder="Warranty details"
                value={formData.warranty}
                onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Validity Period</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., 30 days from issue date"
                value={formData.validity_period}
                onChange={(e) => setFormData({ ...formData, validity_period: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Terms and Conditions</label>
            <textarea
              className="input"
              rows="3"
              placeholder="Terms and conditions"
              value={formData.terms_and_conditions}
              onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Totals */}
          <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">ZMW {calculateTotals().subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT ({formData.vat_percentage}%):</span>
                <span className="font-medium">ZMW {calculateTotals().vatAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-primary-200 pt-2">
                <span className="text-gray-900">Total:</span>
                <span className="text-primary-600">ZMW {calculateTotals().total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="btn btn-outline flex items-center space-x-1"
            >
              <Save className="w-4 h-4" />
              <span>Save as Draft</span>
            </button>
            <button
              type="submit"
              onClick={(e) => handleSubmit(e, false)}
              className="btn btn-primary"
            >
              {editingQuotation ? 'Update Quotation' : 'Create Quotation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}