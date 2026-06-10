import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, PackageOpen, CheckCircle } from 'lucide-react'
import Card from '../components/Card'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import { purchaseOrdersAPI, suppliersAPI, productsAPI } from '../services/api'

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPO, setEditingPO] = useState(null)
  const [formData, setFormData] = useState({
    supplier: '',
    expected_delivery_date: '',
    status: 'pending',
    notes: '',
    items: [{ product: '', quantity: '', unit_price: '' }],
  })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [poRes, suppliersRes, productsRes] = await Promise.all([
        purchaseOrdersAPI.getAll(),
        suppliersAPI.getAll(),
        productsAPI.getAll(),
      ])
      setPurchaseOrders(poRes.data.results || poRes.data)
      setSuppliers(suppliersRes.data.results || suppliersRes.data)
      setProducts(productsRes.data.results || productsRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        items: formData.items.map(item => ({
          product: item.product,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
        })),
      }
      if (editingPO) {
        await purchaseOrdersAPI.update(editingPO.id, data)
      } else {
        await purchaseOrdersAPI.create(data)
      }
      setShowModal(false)
      resetForm()
      fetchAll()
    } catch (error) {
      console.error('Failed to save purchase order:', error)
      alert('Failed to save purchase order')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return
    
    try {
      await purchaseOrdersAPI.delete(id)
      fetchAll()
    } catch (error) {
      console.error('Failed to delete purchase order:', error)
      alert('Failed to delete purchase order')
    }
  }

  const handleReceive = async (id) => {
    if (!confirm('Mark this purchase order as received? This will update product quantities.')) return
    
    try {
      await purchaseOrdersAPI.receive(id)
      fetchAll()
    } catch (error) {
      console.error('Failed to receive purchase order:', error)
      alert('Failed to receive purchase order')
    }
  }

  const handleEdit = (po) => {
    setEditingPO(po)
    setFormData({
      supplier: po.supplier,
      expected_delivery_date: po.expected_delivery_date?.split('T')[0] || '',
      status: po.status,
      notes: po.notes || '',
      items: po.items.map(item => ({
        product: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingPO(null)
    setFormData({
      supplier: '',
      expected_delivery_date: '',
      status: 'pending',
      notes: '',
      items: [{ product: '', quantity: '', unit_price: '' }],
    })
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: '', unit_price: '' }],
    })
  }

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }

  const filteredPOs = purchaseOrders.filter(po =>
    po.supplier_details?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.id.toString().includes(searchTerm)
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'ordered': return 'bg-blue-100 text-blue-800'
      case 'received': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const columns = [
    { header: 'PO #', accessor: 'id' },
    { header: 'Supplier', render: (row) => row.supplier_details?.name || '-' },
    { header: 'Order Date', render: (row) => new Date(row.order_date).toLocaleDateString() },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(row.status)}`}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      )
    },
    { 
      header: 'Total', 
      render: (row) => `ZMW ${parseFloat(row.total_amount).toLocaleString()}`
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          {row.status !== 'received' && (
            <button
              onClick={() => handleReceive(row.id)}
              className="p-1 text-green-600 hover:text-green-800"
              title="Mark as Received"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleEdit(row)}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  if (loading) return <Loading fullScreen />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600">Manage your stock orders</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search purchase orders..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <Table columns={columns} data={filteredPOs} />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingPO ? 'Edit Purchase Order' : 'New Purchase Order'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Supplier *</label>
              <select
                required
                className="input"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              >
                <option value="">Select supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Expected Delivery Date</label>
              <input
                type="date"
                className="input"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="ordered">Ordered</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="label">Items *</label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Item
              </button>
            </div>
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-end">
                <div className="col-span-5">
                  <label className="label text-xs">Product</label>
                  <select
                    required
                    className="input"
                    value={item.product}
                    onChange={(e) => updateItem(index, 'product', e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label text-xs">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <label className="label text-xs">Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
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
            <button type="submit" className="btn btn-primary">
              {editingPO ? 'Update' : 'Create'} Purchase Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
