import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Search, Edit, Trash2, ScanLine, Camera, RefreshCw, Barcode, Download, Printer } from 'lucide-react'
import Card from '../components/Card'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import BarcodeScanner from '../components/BarcodeScanner'
import { productsAPI, barcodeAPI } from '../services/api'
import { generateBarcodeDataUrl, downloadBarcode, printBarcode } from '../services/barcodeRenderer'

function generateId(prefix = '') {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}${ts}${rand}`
}

function generateBarcode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [barcodeViewProduct, setBarcodeViewProduct] = useState(null)
  const [barcodeImageUrl, setBarcodeImageUrl] = useState(null)
  const barcodeImgRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '', category: '', sku: '', barcode: '',
    buying_price: '', selling_price: '', quantity: '',
    minimum_stock: '10', supplier: '', description: '',
  })

  useEffect(() => { fetchProducts() }, [])

  useEffect(() => {
    if (barcodeViewProduct && barcodeViewProduct.barcode) {
      setBarcodeImageUrl(generateBarcodeDataUrl(barcodeViewProduct.barcode))
    } else {
      setBarcodeImageUrl(null)
    }
  }, [barcodeViewProduct])

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

  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '', category: '', sku: generateId('SKU-'), barcode: generateBarcode(),
      buying_price: '', selling_price: '', quantity: '',
      minimum_stock: '10', supplier: '', description: '',
    })
    setShowModal(true)
  }

  const handleGenerateIds = () => {
    setFormData(prev => ({
      ...prev,
      sku: generateId('SKU-'),
      barcode: generateBarcode(),
    }))
  }

  const handleScannerResult = useCallback((product) => {
    setShowScanner(false)
    if (product && product.id) {
      handleEdit(product)
    } else if (product && product.barcode) {
      setFormData(prev => ({ ...prev, barcode: product.barcode, name: product.name || '', sku: product.sku || generateId('SKU-') }))
      setShowModal(true)
    }
  }, [])

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
      barcode: product.barcode || '',
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
      name: '', category: '', sku: '', barcode: '',
      buying_price: '', selling_price: '', quantity: '',
      minimum_stock: '10', supplier: '', description: '',
    })
  }

  const handleBarcodeSearch = async () => {
    if (!searchTerm.trim()) return
    try {
      const res = await barcodeAPI.lookup(searchTerm.trim())
      if (res.data) {
        handleEdit(res.data)
        setSearchTerm('')
      }
    } catch {
      setSearchTerm('')
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'SKU', accessor: 'sku' },
    {
      header: 'Barcode',
      render: (row) => (
        <span className="text-xs font-mono text-gray-500">
          {row.barcode || '-'}
        </span>
      )
    },
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
          {row.barcode && (
            <button onClick={() => setBarcodeViewProduct(row)} className="p-1 text-emerald-600 hover:text-emerald-800" title="View barcode">
              <Barcode className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => handleEdit(row)} className="p-1 text-blue-600 hover:text-blue-800">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-1 text-red-600 hover:text-red-800">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  if (loading) return <Loading fullScreen />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your inventory</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      <Card>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search by name, SKU, barcode..." className="input pl-10"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSearch()} />
          </div>
          <button onClick={() => setShowScanner(true)} className="btn btn-secondary flex items-center gap-2" title="Scan barcode">
            <Camera className="w-5 h-5" />
            <span className="hidden sm:inline">Scan</span>
          </button>
        </div>
      </Card>

      {showScanner && (
        <Card>
          <BarcodeScanner
            onProductFound={handleScannerResult}
            onClose={() => setShowScanner(false)}
          />
        </Card>
      )}

      <Card>
        <Table columns={columns} data={filteredProducts} />
      </Card>

      <Modal isOpen={!!barcodeViewProduct} onClose={() => setBarcodeViewProduct(null)}
        title={barcodeViewProduct ? `Barcode: ${barcodeViewProduct.name}` : ''} size="sm">
        {barcodeViewProduct && (
          <div className="text-center space-y-4 py-4">
            {barcodeImageUrl ? (
              <>
                <img ref={barcodeImgRef} src={barcodeImageUrl}
                  alt={`Barcode for ${barcodeViewProduct.name}`}
                  className="mx-auto max-w-full border border-gray-200 rounded-lg p-2"
                  style={{ imageRendering: 'pixelated', maxHeight: 160 }}
                />
                <p className="text-lg font-mono font-bold text-gray-800">{barcodeViewProduct.barcode}</p>
                <p className="text-sm text-gray-500">{barcodeViewProduct.name} — {barcodeViewProduct.sku}</p>
                <div className="flex justify-center gap-3 pt-2">
                  <button onClick={() => downloadBarcode(barcodeImageUrl, `barcode_${barcodeViewProduct.sku}.png`)}
                    className="btn btn-primary inline-flex items-center gap-2">
                    <Download size={16} /> Download
                  </button>
                  <button onClick={() => printBarcode(barcodeImageUrl)}
                    className="btn btn-secondary inline-flex items-center gap-2">
                    <Printer size={16} /> Print
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-500 py-8">No barcode assigned to this product.</p>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm() }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Product Name *</label>
              <input type="text" required className="input" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Category *</label>
              <input type="text" required className="input" value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">SKU *</label>
                {!editingProduct && (
                  <button type="button" onClick={handleGenerateIds}
                    className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Regenerate
                  </button>
                )}
              </div>
              <input type="text" required className="input font-mono text-sm" value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Barcode</label>
                <div className="flex gap-2">
                  {!editingProduct && (
                    <button type="button" onClick={handleGenerateIds}
                      className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </button>
                  )}
                  <button type="button" onClick={() => { setShowScanner(true); setShowModal(false) }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                    <ScanLine className="w-3 h-3" /> Scan
                  </button>
                </div>
              </div>
              <input type="text" className="input font-mono text-sm" value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Auto-generated" />
            </div>
            <div>
              <label className="label">Supplier</label>
              <input type="text" className="input" value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
            </div>
            <div>
              <label className="label">Buying Price *</label>
              <input type="number" step="0.01" required className="input" value={formData.buying_price}
                onChange={(e) => setFormData({ ...formData, buying_price: e.target.value })} />
            </div>
            <div>
              <label className="label">Selling Price *</label>
              <input type="number" step="0.01" required className="input" value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })} />
            </div>
            <div>
              <label className="label">Quantity *</label>
              <input type="number" required className="input" value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
            </div>
            <div>
              <label className="label">Minimum Stock *</label>
              <input type="number" required className="input" value={formData.minimum_stock}
                onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows="3" value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{editingProduct ? 'Update' : 'Create'} Product</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
