import { useEffect, useState } from 'react'
import { Plus, DollarSign } from 'lucide-react'
import Card, { StatCard } from '../components/Card'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import { creditsAPI, customersAPI } from '../services/api'

export default function Credits() {
  const [credits, setCredits] = useState([])
  const [customers, setCustomers] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedCredit, setSelectedCredit] = useState(null)
  const [formData, setFormData] = useState({
    customer: '',
    amount_owed: '',
    borrow_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
  })
  const [paymentData, setPaymentData] = useState({
    amount: '',
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [creditsRes, customersRes, summaryRes] = await Promise.all([
        creditsAPI.getAll(),
        customersAPI.getAll(),
        creditsAPI.getSummary(),
      ])
      setCredits(creditsRes.data.results || creditsRes.data)
      setCustomers(customersRes.data.results || customersRes.data)
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
      await creditsAPI.create(formData)
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Failed to create credit:', error)
      alert('Failed to create credit')
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    try {
      await creditsAPI.recordPayment(selectedCredit.id, paymentData)
      setShowPaymentModal(false)
      setPaymentData({ amount: '', notes: '' })
      fetchData()
    } catch (error) {
      console.error('Failed to record payment:', error)
      alert(error.response?.data?.amount?.[0] || 'Failed to record payment')
    }
  }

  const resetForm = () => {
    setFormData({
      customer: '',
      amount_owed: '',
      borrow_date: new Date().toISOString().split('T')[0],
      due_date: '',
      notes: '',
    })
  }

  const columns = [
    { 
      header: 'Customer', 
      render: (row) => row.customer_details?.name || 'N/A'
    },
    { 
      header: 'Amount Owed', 
      render: (row) => `ZMW ${parseFloat(row.amount_owed).toLocaleString()}`
    },
    { 
      header: 'Amount Paid', 
      render: (row) => `ZMW ${parseFloat(row.amount_paid).toLocaleString()}`
    },
    { 
      header: 'Remaining', 
      render: (row) => (
        <span className="font-semibold text-red-600">
          ZMW {parseFloat(row.remaining_balance).toLocaleString()}
        </span>
      )
    },
    { 
      header: 'Due Date', 
      render: (row) => new Date(row.due_date).toLocaleDateString()
    },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.status === 'paid' ? 'bg-green-100 text-green-800' :
          row.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
          row.status === 'overdue' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        row.status !== 'paid' && (
          <button
            onClick={() => {
              setSelectedCredit(row)
              setShowPaymentModal(true)
            }}
            className="btn btn-primary text-xs py-1 px-3"
          >
            Record Payment
          </button>
        )
      ),
    },
  ]

  if (loading) return <Loading fullScreen />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credits</h1>
          <p className="text-gray-600">Track customer debts and payments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Credit</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Owed"
          value={`ZMW ${summary?.total_owed?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="red"
        />
        <StatCard
          title="Total Paid"
          value={`ZMW ${summary?.total_paid?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Outstanding"
          value={`ZMW ${summary?.total_outstanding?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="yellow"
        />
        <StatCard
          title="Overdue"
          value={summary?.overdue_count || 0}
          icon={DollarSign}
          color="red"
        />
      </div>

      {/* Credits Table */}
      <Card>
        <Table columns={columns} data={credits} />
      </Card>

      {/* Add Credit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title="Record New Credit"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Customer *</label>
            <select
              required
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
            <label className="label">Amount Owed *</label>
            <input
              type="number"
              step="0.01"
              required
              className="input"
              value={formData.amount_owed}
              onChange={(e) => setFormData({ ...formData, amount_owed: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Borrow Date *</label>
              <input
                type="date"
                required
                className="input"
                value={formData.borrow_date}
                onChange={(e) => setFormData({ ...formData, borrow_date: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Due Date *</label>
              <input
                type="date"
                required
                className="input"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
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
              Record Credit
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setPaymentData({ amount: '', notes: '' })
        }}
        title="Record Payment"
      >
        {selectedCredit && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Customer</p>
            <p className="font-semibold text-gray-900">
              {selectedCredit.customer_details?.name}
            </p>
            <p className="text-sm text-gray-600 mt-2">Remaining Balance</p>
            <p className="font-semibold text-red-600">
              ZMW {parseFloat(selectedCredit.remaining_balance).toLocaleString()}
            </p>
          </div>
        )}

        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="label">Payment Amount *</label>
            <input
              type="number"
              step="0.01"
              required
              max={selectedCredit?.remaining_balance}
              className="input"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows="2"
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowPaymentModal(false)
                setPaymentData({ amount: '', notes: '' })
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Record Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
