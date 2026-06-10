import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Edit,
  PiggyBank,
  Plus,
  Trash2,
  Wallet,
  Sparkles,
  TrendingUp,
  Coins,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card, { StatCard } from '../../components/Card'
import Modal from '../../components/Modal'
import Loading from '../../components/Loading'
import { personalFinanceAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#14b8a6', '#f97316']

const TYPE_CATEGORIES = {
  income: ['side_income', 'salary', 'freelance', 'gift', 'refund', 'other'],
  allowance: ['daily_allowance', 'weekly_allowance', 'pocket_money', 'family_support', 'other'],
  expense: ['food', 'transport', 'airtime', 'entertainment', 'clothing', 'personal_care', 'subscriptions', 'savings', 'bills', 'other'],
}

const TYPE_STYLES = {
  income: 'bg-emerald-100 text-emerald-800',
  allowance: 'bg-violet-100 text-violet-800',
  expense: 'bg-rose-100 text-rose-800',
}

function formatMoney(value, currency = 'ZMW') {
  return `${currency} ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatLabel(value) {
  return String(value || '').replace(/_/g, ' ')
}

function formatDay(value) {
  if (!value) return ''
  const [year, month, day] = String(value).split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[Number(month) - 1]} ${Number(day)}`
}

function formatMonth(value) {
  if (!value) return ''
  const [year, month] = String(value).split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[Number(month) - 1]} ${year}`
}

export default function PersonalFinance() {
  const { user } = useAuthStore()
  const currency = user?.currency || 'ZMW'

  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [filterType, setFilterType] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    transaction_type: 'allowance',
    category: 'daily_allowance',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const categoryOptions = useMemo(() => {
    const map = Object.fromEntries(categories.map((c) => [c.value, c.label]))
    return (TYPE_CATEGORIES[formData.transaction_type] || []).map((value) => ({
      value,
      label: map[value] || formatLabel(value),
    }))
  }, [categories, formData.transaction_type])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = filterType !== 'all' ? { transaction_type: filterType } : {}
      const [dashboardRes, transactionsRes, categoriesRes] = await Promise.all([
        personalFinanceAPI.getDashboard(params),
        personalFinanceAPI.getTransactions(params),
        personalFinanceAPI.getCategories(),
      ])
      setDashboard(dashboardRes.data)
      setTransactions(transactionsRes.data.results || transactionsRes.data)
      setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Failed to load personal finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterType])

  const handleTypeChange = (type) => {
    const defaultCategory = TYPE_CATEGORIES[type]?.[0] || 'other'
    setFormData((prev) => ({ ...prev, transaction_type: type, category: defaultCategory }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await personalFinanceAPI.update(editing.id, formData)
      } else {
        await personalFinanceAPI.create(formData)
      }
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Failed to save transaction:', error)
      alert(error.response?.data?.detail || 'Failed to save transaction')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this personal transaction?')) return
    try {
      await personalFinanceAPI.delete(id)
      fetchData()
    } catch (error) {
      alert('Failed to delete transaction')
    }
  }

  const handleEdit = (item) => {
    setEditing(item)
    setFormData({
      title: item.title,
      amount: item.amount,
      transaction_type: item.transaction_type,
      category: item.category,
      date: item.date,
      notes: item.notes || '',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditing(null)
    setFormData({
      title: '',
      amount: '',
      transaction_type: 'allowance',
      category: 'daily_allowance',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    })
  }

  if (loading) return <Loading fullScreen />

  const summary = dashboard?.summary || {}
  const dailyTrend = (dashboard?.daily_trend || []).map((d) => ({
    ...d,
    dayLabel: formatDay(d.day),
    moneyIn: Number(d.income || 0) + Number(d.allowance || 0),
    expense: Number(d.expense || 0),
  }))
  const monthlyTrend = (dashboard?.monthly_trend || []).map((m) => ({
    ...m,
    monthLabel: formatMonth(m.month),
    moneyIn: Number(m.income || 0) + Number(m.allowance || 0),
    expense: Number(m.expense || 0),
  }))
  const expensePie = (dashboard?.expense_by_category || []).map((item) => ({
    ...item,
    name: formatLabel(item.category),
    value: Number(item.total || 0),
  }))

  return (
    <div className="space-y-6">
      {/* Hero — visually distinct from business dashboard */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-600 p-6 text-white shadow-lg md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Personal only — not linked to business books
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">Personal Finance</h1>
            <p className="mt-2 max-w-xl text-sm text-violet-100 md:text-base">
              Track daily allowances, small side income, and personal spending in a space that stays
              completely separate from your Kapita business accounts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { resetForm(); setShowModal(true) }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-violet-700 shadow-md transition hover:bg-violet-50"
          >
            <Plus className="h-4 w-4" />
            Add entry
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Side income"
          value={formatMoney(summary.total_income, currency)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Allowances"
          value={formatMoney(summary.total_allowances, currency)}
          icon={Coins}
          color="blue"
        />
        <StatCard
          title="Personal spending"
          value={formatMoney(summary.total_expenses, currency)}
          icon={ArrowDownLeft}
          color="red"
        />
        <StatCard
          title="Net balance"
          value={formatMoney(summary.net_balance, currency)}
          icon={PiggyBank}
          color={Number(summary.net_balance) >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Savings rate pill */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700">
          <Wallet className="h-4 w-4" />
          Savings rate: {summary.savings_rate ?? 0}%
        </span>
        <span className="text-sm text-gray-500">
          {summary.transaction_count ?? 0} personal entries recorded
        </span>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">Daily cash flow (30 days)</h2>
          <p className="mb-4 text-sm text-gray-500">Money in vs personal spending</p>
          {dailyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyTrend}>
                <defs>
                  <linearGradient id="moneyInGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="dayLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatMoney(v, currency)} />
                <Legend />
                <Area type="monotone" dataKey="moneyIn" name="Money in" stroke="#8b5cf6" fill="url(#moneyInGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" name="Spending" stroke="#f43f5e" fill="url(#expenseGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
              Add your first allowance or expense to see daily trends.
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-semibold text-gray-900">Spending breakdown</h2>
          <p className="mb-4 text-sm text-gray-500">Where personal money goes</p>
          {expensePie.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={expensePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {expensePie.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(v, currency)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
              No personal expenses yet.
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Monthly overview</h2>
        <p className="mb-4 text-sm text-gray-500">Income + allowances vs spending over time</p>
        {monthlyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatMoney(v, currency)} />
              <Legend />
              <Bar dataKey="moneyIn" name="Money in" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Spending" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
            Monthly charts appear once you log a few entries.
          </div>
        )}
      </Card>

      {/* Transactions */}
      <Card>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Personal ledger</h2>
            <p className="text-sm text-gray-500">Daily income, allowances & spending</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'allowance', 'income', 'expense'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
                  filterType === type
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
            <ArrowUpRight className="mx-auto mb-3 h-8 w-8 text-violet-400" />
            <p className="font-medium text-gray-900">No personal entries yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Log an allowance, side income, or personal expense to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Title</th>
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Category</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4 text-gray-600">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 font-medium text-gray-900">{item.title}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${TYPE_STYLES[item.transaction_type]}`}>
                        {item.type_label || item.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 pr-4 capitalize text-gray-600">
                      {item.category_label || formatLabel(item.category)}
                    </td>
                    <td className={`py-3 pr-4 font-semibold ${item.transaction_type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {item.transaction_type === 'expense' ? '−' : '+'} {formatMoney(item.amount, currency)}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleEdit(item)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => handleDelete(item.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
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

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm() }}
        title={editing ? 'Edit personal entry' : 'Add personal entry'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {['allowance', 'income', 'expense'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${
                    formData.transaction_type === type
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Title *</label>
            <input className="input" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Lunch money, freelance gig" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount ({currency}) *</label>
              <input className="input" type="number" step="0.01" min="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Date *</label>
              <input className="input" type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Category *</label>
            <select className="input" required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              {categoryOptions.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional — keep personal notes here" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn btn-primary flex-1 bg-violet-600 hover:bg-violet-700">
              {editing ? 'Save changes' : 'Add entry'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm() }}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
