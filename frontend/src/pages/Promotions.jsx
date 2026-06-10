import { useState, useEffect } from 'react'
import { Plus, Percent, Tag, Calendar, ToggleLeft, ToggleRight, Trash2, Edit } from 'lucide-react'
import Card from '../components/Card'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import { promotionsAPI, productsAPI } from '../services/api'

export default function Promotions() {
  const [promotions, setPromotions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    apply_to_all_products: true,
    product_ids: [],
    start_date: '',
    end_date: '',
    status: 'active',
  })

  useEffect(() => {
    loadPromotions()
    loadProducts()
  }, [])

  const loadPromotions = async () => {
    try {
      const response = await promotionsAPI.getAll()
      // API returns paginated { count, results: [...] } or plain array
      setPromotions(response.data.results ?? response.data ?? [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to load promotions:', error)
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll()
      // API returns paginated { count, results: [...] } or plain array
      setProducts(response.data.results ?? response.data ?? [])
    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingPromotion) {
        await promotionsAPI.update(editingPromotion.id, formData)
      } else {
        await promotionsAPI.create(formData)
      }
      setModalOpen(false)
      resetForm()
      loadPromotions()
    } catch (error) {
      console.error('Failed to save promotion:', error)
      alert('Failed to save promotion. Please try again.')
    }
  }

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion)
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      apply_to_all_products: promotion.apply_to_all_products,
      product_ids: promotion.product_ids || [],
      start_date: promotion.start_date,
      end_date: promotion.end_date,
      status: promotion.status,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this promotion? This action cannot be undone.')) {
      setDeleting(id)
      try {
        await promotionsAPI.delete(id)
        alert('Promotion deleted successfully!')
        loadPromotions()
      } catch (error) {
        console.error('Failed to delete promotion:', error)
        const errorMsg = error.response?.data?.detail || error.response?.data?.error || 'Failed to delete promotion. Please try again.'
        alert(errorMsg)
      } finally {
        setDeleting(null)
      }
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await promotionsAPI.toggleStatus(id)
      loadPromotions()
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      apply_to_all_products: true,
      product_ids: [],
      start_date: '',
      end_date: '',
      status: 'active',
    })
    setEditingPromotion(null)
  }

  const getStatusBadge = (promotion) => {
    if (promotion.is_currently_active) {
      return <span className="badge badge-success">Active</span>
    } else if (promotion.status === 'inactive') {
      return <span className="badge badge-secondary">Inactive</span>
    } else {
      return <span className="badge badge-error">Expired</span>
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions & Discounts</h1>
          <p className="mt-1 text-gray-600">
            Create and manage special offers and discounts
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setModalOpen(true)
          }}
          className="btn btn-primary inline-flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Promotion</span>
        </button>
      </div>

      {/* Active Promotions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">All Promotions</h2>
          <span className="text-sm text-gray-500">{Array.isArray(promotions) ? promotions.length : 0} total</span>
        </div>

        {!Array.isArray(promotions) || promotions.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No promotions yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first promotion to offer discounts to customers
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="btn btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Promotion</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Discount</th>
                  <th className="pb-3 pr-4">Products</th>
                  <th className="pb-3 pr-4">Duration</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Used</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {promotions.map((promotion) => (
                  <tr key={promotion.id}>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-gray-900">{promotion.name}</p>
                      {promotion.description && (
                        <p className="text-sm text-gray-500">{promotion.description}</p>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center space-x-1">
                        <Percent className="w-4 h-4 text-primary-600" />
                        <span className="font-semibold text-primary-600">
                          {promotion.discount_type === 'percentage'
                            ? `${promotion.discount_value}%`
                            : `K${promotion.discount_value}`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {promotion.discount_type === 'percentage' ? 'Percentage off' : 'Fixed amount'}
                      </p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-sm text-gray-900">
                        {promotion.product_names.join(', ')}
                      </p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-sm text-gray-900">
                        {new Date(promotion.start_date).toLocaleDateString()} -
                      </p>
                      <p className="text-sm text-gray-900">
                        {new Date(promotion.end_date).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-4 pr-4">{getStatusBadge(promotion)}</td>
                    <td className="py-4 pr-4">
                      <span className="font-medium text-gray-900">{promotion.times_used}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleStatus(promotion.id)}
                          className="text-gray-600 hover:text-primary-600"
                          title={promotion.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {promotion.status === 'active' ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(promotion)}
                          className="text-gray-600 hover:text-primary-600"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(promotion.id)}
                          disabled={deleting === promotion.id}
                          className="text-gray-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete promotion"
                        >
                          {deleting === promotion.id ? (
                            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Promotion Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          resetForm()
        }}
        title={editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Promotion Name *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Summer Sale, Back to School"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Discount Type *</label>
              <select
                className="input"
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
              >
                <option value="percentage">Percentage Off (%)</option>
                <option value="fixed">Fixed Amount (K)</option>
              </select>
            </div>

            <div>
              <label className="label">Discount Value *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                max={formData.discount_type === 'percentage' ? '100' : undefined}
                className="input"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                placeholder={formData.discount_type === 'percentage' ? '0-100' : 'Amount'}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={formData.apply_to_all_products}
                onChange={(e) =>
                  setFormData({ ...formData, apply_to_all_products: e.target.checked })
                }
              />
              <span className="text-sm text-gray-700">Apply to all products</span>
            </label>
          </div>

          {!formData.apply_to_all_products && (
            <div>
              <label className="label">Select Products</label>
              <select
                multiple
                className="input"
                size="5"
                value={formData.product_ids}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    product_ids: Array.from(e.target.selectedOptions, (option) =>
                      parseInt(option.value)
                    ),
                  })
                }
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (K{product.selling_price})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                required
                className="input"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div>
              <label className="label">End Date *</label>
              <input
                type="date"
                required
                className="input"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false)
                resetForm()
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingPromotion ? 'Update' : 'Create'} Promotion
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
