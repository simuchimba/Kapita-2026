import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Package, CreditCard } from 'lucide-react'
import Card, { StatCard } from '../components/Card'
import Loading from '../components/Loading'
import { analyticsAPI, salesAPI, expensesAPI } from '../services/api'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [capital, setCapital] = useState(null)
  const [cashflow, setCashflow] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [expensesByCategory, setExpensesByCategory] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [capitalRes, cashflowRes, topProductsRes, expensesRes] = await Promise.all([
        analyticsAPI.getCapital(),
        analyticsAPI.getCashflow(),
        salesAPI.getTopProducts(10),
        expensesAPI.getByCategory(),
      ])

      setCapital(capitalRes.data)
      setCashflow(cashflowRes.data)
      setTopProducts(topProductsRes.data)
      setExpensesByCategory(expensesRes.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading fullScreen />

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
  const topProductsChartData = Array.isArray(topProducts)
    ? topProducts.map((item) => ({
        ...item,
        productName: item?.product_name || item?.product__name || 'Unknown product',
        total_revenue: Number(item?.total_revenue || 0),
        total_quantity: Number(item?.total_quantity || 0),
      }))
    : []
  const expensesChartData = Array.isArray(expensesByCategory)
    ? expensesByCategory.map((item) => ({
        ...item,
        categoryLabel: String(item?.category || '').replace(/_/g, ' '),
        total: Number(item?.total || 0),
      }))
    : []
  const hasTopProductsData = topProductsChartData.length > 0
  const hasExpensesData = expensesChartData.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Advanced business insights and metrics</p>
      </div>

      {/* Capital Breakdown */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Capital Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Current Capital"
            value={`ZMW ${capital?.current_capital?.toLocaleString() || 0}`}
            icon={DollarSign}
            color="primary"
          />
          <StatCard
            title="Cash Available"
            value={`ZMW ${capital?.cash_available?.toLocaleString() || 0}`}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Inventory Value"
            value={`ZMW ${capital?.inventory_value?.toLocaleString() || 0}`}
            icon={Package}
            color="blue"
          />
          <StatCard
            title="Credit Receivables"
            value={`ZMW ${capital?.credit_receivables?.toLocaleString() || 0}`}
            icon={CreditCard}
            color="yellow"
          />
        </div>
      </div>

      {/* Cashflow Analysis */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Cashflow Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Money In</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sales Revenue</span>
                <span className="font-semibold text-green-600">
                  ZMW {cashflow?.money_in?.sales?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Credit Payments</span>
                <span className="font-semibold text-green-600">
                  ZMW {cashflow?.money_in?.credit_payments?.toLocaleString() || 0}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total In</span>
                  <span className="font-bold text-green-600 text-lg">
                    ZMW {cashflow?.money_in?.total?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Money Out</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Expenses</span>
                <span className="font-semibold text-red-600">
                  ZMW {cashflow?.money_out?.expenses?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Reinvestments</span>
                <span className="font-semibold text-red-600">
                  ZMW {cashflow?.money_out?.reinvestments?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Withdrawals</span>
                <span className="font-semibold text-red-600">
                  ZMW {cashflow?.money_out?.withdrawals?.toLocaleString() || 0}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Out</span>
                  <span className="font-bold text-red-600 text-lg">
                    ZMW {cashflow?.money_out?.total?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Net Cashflow</h3>
            <span className={`text-2xl font-bold ${
              cashflow?.net_cashflow >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ZMW {cashflow?.net_cashflow?.toLocaleString() || 0}
            </span>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Selling Products
          </h3>
          {hasTopProductsData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="productName" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#111827',
                  }} 
                />
                <Bar dataKey="total_revenue" fill="#10b981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
              No sales yet. Top products will appear after you record sales.
            </div>
          )}
        </Card>

        {/* Expenses Distribution */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Expense Distribution
          </h3>
          {hasExpensesData ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoryLabel, percent }) => `${categoryLabel}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {expensesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#111827',
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
              No expenses yet. Add expenses to populate this chart.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
