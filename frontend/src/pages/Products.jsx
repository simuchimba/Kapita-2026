import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react'
import Card from '../components/Card'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import { productsAPI } from '../services/api'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    buying_price: '',
    selling_price: '',
    quantity: '',
    minimum_stock: '10',
    supplier: '',
    description: '',
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll()
      setProducts(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, formData)
      } else {
        await productsAPI.create(formData)
      }
      setShowModal(false)
      resetForm()
      fetchProducts()
    } catch (error) {
      console.error('Failed to save product:', error)
      alert('Failed to save product')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      await productsAPI.delete(id)
      fetchProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      sku: product.sku,
      buying_price: product.buying_price,
      selling_price: product.selling_price,
      quantity: product.quantity,
      minimum_stock: product.minimum_stock,
      supplier: product.supplier || '',
      description: product.description || '',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      category: '',
      sku: '',
      buying_price: '',
      selling_price: '',
      quantity: '',
      minimum_stock: '10',
      supplier: '',
      description: '',
    })
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Category', accessor: 'category' },
    { 
      header: 'Quantity', 
      render: (row) => (
        <span className={row.is_low_stock ? 'text-red-600 font-semibold' : ''}>
          {row.quantity}
          {row.is_low_stock && ' ⚠️'}
        </span>
      )
    },
    { 
      header: 'Buying Price', 
      render: (row) => `ZMW ${parseFloat(row.buying_price).toLocaleString()}`
    },
    { 
      header: 'Selling Price', 
      render: (row) => `ZMW ${parseFloat(row.selling_price).toLocaleString()}`
    },
    { 
      header: 'Profit Margin', 
      render: (row) => `${parseFloat(row.profit_margin).toFixed(1)}%`
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your inventory</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <Table columns={columns} data={filteredProducts} />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Product Name *</label>
              <input
                type="text"
                required
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Category *</label>
              <input
                type="text"
                required
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div>
              <label className="label">SKU *</label>
              <input
                type="text"
                required
                className="input"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Supplier</label>
              <input
                type="text"
                className="input"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Buying Price *</label>
              <input
                type="number"
                step="0.01"
                required
                className="input"
                value={formData.buying_price}
                onChange={(e) => setFormData({ ...formData, buying_price: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Selling Price *</label>
              <input
                type="number"
                step="0.01"
                required
                className="input"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Quantity *</label>
              <input
                type="number"
                required
                className="input"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Minimum Stock *</label>
              <input
                type="number"
                required
                className="input"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              {editingProduct ? 'Update' : 'Create'} Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
