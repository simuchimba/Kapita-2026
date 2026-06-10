import { useEffect, useState } from 'react'
import { Plus, TrendingUp } from 'lucide-react'
import Card, { StatCard } from '../components/Card'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import { reinvestmentsAPI } from '../services/api'

export default function Reinvestments() {
  const [reinvestments, setReinvestments] = useState([])
  const [purposes, setPurposes] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    expected_margin: '20',
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [reinvestmentsRes, purposesRes, summaryRes] = await Promise.all([
        reinvestmentsAPI.getAll(),
        reinvestmentsAPI.getPurposes(),
        reinvestmentsAPI.getSummary(),
      ])
      setReinvestments(reinvestmentsRes.data.results || reinvestmentsRes.data)
      setPurposes(purposesRes.data)
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
      await reinvestmentsAPI.create(formData)
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Failed to create reinvestment:', error)
      alert('Failed to create reinvestment')
    }
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      purpose: '',
      date: new Date().toISOString().split('T')[0],
      expected_margin: '20',
      notes: '',
    })
  }

  const columns = [
    { 
      header: 'Date', 
      render: (row) => new Date(row.date).toLocaleDateString()
    },
    { 
      header: 'Purpose', 
      render: (row) => (
        <span className="px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800">
          {row.purpose.replace('_', ' ')}
        </span>
      )
    },
    { 
      header: 'Amount', 
      render: (row) => `ZMW ${parseFloat(row.amount).toLocaleString()}`
    },
    { 
      header: 'Expected Margin', 
      render: (row) => `${parseFloat(row.expected_margin)}%`
    },
    { 
      header: 'Projected Profit', 
      render: (row) => (
        <span className="font-semibold text-green-600">
          ZMW {parseFloat(row.projected_profit).toLocaleString()}
        </span>
      )
    },
    { 
      header: 'Projected Return', 
      render: (row) => `ZMW ${parseFloat(row.projected_return).toLocaleString()}`
    },
  ]

  if (loading) return <Loading fullScreen />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reinvestments</h1>
          <p className="text-gray-600">Track money reinvested into business</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Reinvestment</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Reinvested"
          value={`ZMW ${summary?.total_reinvested?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="primary"
        />
        <StatCard
          title="Projected Profit"
          value={`ZMW ${summary?.total_projected_profit?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Projected Return"
          value={`ZMW ${summary?.total_projected_return?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Reinvestments Table */}
      <Card>
        <Table columns={columns} data={reinvestments} />
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title="Record Reinvestment"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="label">Purpose *</label>
            <select
              required
              className="input"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            >
              <option value="">Select purpose</option>
              {purposes.map((purpose) => (
                <option key={purpose.value} value={purpose.value}>
                  {purpose.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Expected Profit Margin (%) *</label>
            <input
              type="number"
              step="0.01"
              required
              className="input"
              value={formData.expected_margin}
              onChange={(e) => setFormData({ ...formData, expected_margin: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-500">
              Expected profit percentage from this reinvestment
            </p>
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

          {formData.amount && formData.expected_margin && (
            <div className="p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-gray-600">Projected Profit</p>
              <p className="text-lg font-semibold text-primary-600">
                ZMW {(formData.amount * (formData.expected_margin / 100)).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-2">Projected Return</p>
              <p className="text-lg font-semibold text-green-600">
                ZMW {(parseFloat(formData.amount) + (formData.amount * (formData.expected_margin / 100))).toLocaleString()}
              </p>
            </div>
          )}

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
              Record Reinvestment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
