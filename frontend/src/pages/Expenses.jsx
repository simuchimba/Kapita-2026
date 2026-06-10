import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, TrendingDown } from 'lucide-react'
import Card, { StatCard } from '../components/Card'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import { expensesAPI } from '../services/api'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [expensesRes, categoriesRes, summaryRes] = await Promise.all([
        expensesAPI.getAll(),
        expensesAPI.getCategories(),
        expensesAPI.getSummary(),
      ])
      setExpenses(expensesRes.data.results || expensesRes.data)
      setCategories(categoriesRes.data)
      setSummary(summaryRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingExpense) {
        await expensesAPI.update(editingExpense.id, formData)
      } else {
        await expensesAPI.create(formData)
      }
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Failed to save expense:', error)
      alert('Failed to save expense')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      await expensesAPI.delete(id)
      fetchData()
    } catch (error) {
      console.error('Failed to delete expense:', error)
      alert('Failed to delete expense')
    }
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setFormData({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      notes: expense.notes || '',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingExpense(null)
    setFormData({
      title: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    })
  }

  const columns = [
    { 
      header: 'Date', 
      render: (row) => new Date(row.date).toLocaleDateString()
    },
    { header: 'Title', accessor: 'title' },
    { 
      header: 'Category', 
      render: (row) => (
        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
          {row.category.replace('_', ' ')}
        </span>
      )
    },
    { 
      header: 'Amount', 
      render: (row) => (
        <span className="font-semibold text-red-600">
          ZMW {parseFloat(row.amount).toLocaleString()}
        </span>
      )
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
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Track all business expenses</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Expenses"
          value={`ZMW ${summary?.total_expenses?.toLocaleString() || 0}`}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Expense Count"
          value={summary?.expense_count || 0}
          icon={TrendingDown}
          color="yellow"
        />
        <StatCard
          title="Categories"
          value={categories.length}
          icon={TrendingDown}
          color="blue"
        />
      </div>

      {/* Expenses Table */}
      <Card>
        <Table columns={columns} data={expenses} />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount *</label>
              <input
                type="number"
                step="0.01"
                required
                className="input"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                required
                className="input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Category *</label>
            <select
              required
              className="input"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
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
              {editingExpense ? 'Update' : 'Create'} Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
