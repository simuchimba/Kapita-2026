import { useEffect, useState } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  CreditCard, 
  AlertTriangle,
  ShoppingCart,
  Users,
  Receipt,
  Percent,
  ArrowUp,
  ArrowDown,
  Activity,
  Target,
  ArrowRightCircle,
} from 'lucide-react'
import { StatCard } from '../components/Card'
import Card from '../components/Card'
import Loading from '../components/Loading'
import { analyticsAPI, salesAPI, expensesAPI, productsAPI, customersAPI, creditsAPI, outgoingPaymentsAPI } from '../services/api'
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  LineChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [dailySales, setDailySales] = useState([])
  const [expensesByCategory, setExpensesByCategory] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [credits, setCredits] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [
        dashboardRes, 
        salesRes, 
        expensesRes, 
        topProductsRes,
        productsRes,
        customersRes,
        creditsRes
      ] = await Promise.all([
        analyticsAPI.getDashboard(),
        salesAPI.getDailySales(),
        expensesAPI.getByCategory(),
        salesAPI.getTopProducts(5),
        productsAPI.getAll(),
        customersAPI.getAll(),
        creditsAPI.getAll(),
      ])

      setDashboardData(dashboardRes.data)
      setDailySales(salesRes.data)
      setExpensesByCategory(expensesRes.data)
      setTopProducts(topProductsRes.data || [])
      setProducts(productsRes.data.results || productsRes.data || [])
      setCustomers(customersRes.data.results || customersRes.data || [])
      setCredits(creditsRes.data.results || creditsRes.data || [])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num == null || num === '') return '0'
    const n = Number(num)
    if (isNaN(n)) return '0'
    return n.toLocaleString()
  }

  if (loading) return <Loading fullScreen />

  const { summary, recent_activity, alerts } = dashboardData || {}
  const recordCounts = summary?.record_counts || {}

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  
  // Calculate additional metrics
  const lowStockProducts = products.filter(p => p.quantity <= p.minimum_stock)
  const totalCustomers = customers.length
  const activeCredits = credits.filter(c => c.status === 'pending' || c.status === 'partial')
  const overdueCredits = credits.filter(c => c.due_date && new Date(c.due_date) < new Date() && c.status !== 'paid')
  
  // Calculate profit margin
  const profitMargin = summary?.total_revenue ? 
    ((summary.net_profit / summary.total_revenue) * 100).toFixed(1) : 0
  
  // Top products chart data
  const topProductsData = topProducts.map(item => ({
    name: item.product_name,
    revenue: Number(item.total_revenue || 0),
    quantity: Number(item.total_quantity || 0),
  }))
  
  // Inventory health data
  const inventoryHealthData = [
    { status: 'In Stock', count: products.filter(p => p.quantity > p.minimum_stock).length, fill: '#10b981' },
    { status: 'Low Stock', count: lowStockProducts.length, fill: '#f59e0b' },
    { status: 'Out of Stock', count: products.filter(p => p.quantity === 0).length, fill: '#ef4444' },
  ]
  
  // Payment type distribution
  const last30Sales = Array.isArray(dailySales) ? dailySales : []
  const recentSales = recent_activity?.sales || []
  const paymentTypes = recentSales.reduce((acc, sale) => {
    acc[sale.payment_type] = (acc[sale.payment_type] || 0) + 1
    return acc
  }, {})
  
  const paymentTypeData = Object.entries(paymentTypes).map(([type, count], index) => ({
    name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
    fill: COLORS[index % COLORS.length]
  }))
  
  // Credit status data
  const creditStatusData = [
    { status: 'Active', count: activeCredits.length, fill: '#3b82f6' },
    { status: 'Overdue', count: overdueCredits.length, fill: '#ef4444' },
    { status: 'Paid', count: credits.filter(c => c.status === 'paid').length, fill: '#10b981' },
  ]
  
  const toDateKey = (dateObj) => {
    const y = dateObj.getFullYear()
    const m = String(dateObj.getMonth() + 1).padStart(2, '0')
    const d = String(dateObj.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const formatChartDay = (value) => {
    if (!value) return 'No date'

    const rawValue = String(value)
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
      const [year, month, day] = rawValue.split('-')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${monthNames[Number(month) - 1]} ${Number(day)}`
    }

    const parsedDate = new Date(rawValue)
    if (!Number.isNaN(parsedDate.getTime())) {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(parsedDate)
    }

    return rawValue
  }

  const salesByDay = new Map(
    (Array.isArray(dailySales) ? dailySales : []).map((item) => {
      const rawDay = String(item?.day || '')
      const dayKey = /^\d{4}-\d{2}-\d{2}/.test(rawDay)
        ? rawDay.slice(0, 10)
        : toDateKey(new Date(rawDay))

      return [
        dayKey,
        {
          total: Number(item?.total || 0),
          count: Number(item?.count || 0),
        },
      ]
    })
  )

  const baseTrendData = Array.from({ length: 30 }, (_, index) => {
    const day = new Date()
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - (29 - index))

    const dayKey = toDateKey(day)
    const values = salesByDay.get(dayKey) || { total: 0, count: 0 }

    return {
      day: dayKey,
      dayLabel: formatChartDay(dayKey),
      total: Number(values.total || 0),
      count: Number(values.count || 0),
    }
  })

  const dailySalesChartData = Array.isArray(dailySales)
    ? baseTrendData.map((item, index, arr) => {
        const recentWindow = arr.slice(Math.max(0, index - 6), index + 1)
        const rollingAvg =
          recentWindow.reduce((sum, point) => sum + point.total, 0) / recentWindow.length

        return {
          ...item,
          rollingAvg: Number(rollingAvg.toFixed(2)),
        }
      })
    : []
  
  // Growth calculations (comparing last 7 days vs previous 7 days) - MUST be after dailySalesChartData
  const last7Days = dailySalesChartData.slice(-7)
  const prev7Days = dailySalesChartData.slice(-14, -7)
  const last7Total = last7Days.reduce((sum, item) => sum + item.total, 0)
  const prev7Total = prev7Days.reduce((sum, item) => sum + item.total, 0)
  const growthPercentage = prev7Total > 0 ? 
    (((last7Total - prev7Total) / prev7Total) * 100).toFixed(1) : 0
  
  const expensesChartData = Array.isArray(expensesByCategory)
    ? expensesByCategory.map((item) => ({
        ...item,
        categoryLabel: String(item?.category || '').replace(/_/g, ' '),
        total: Number(item?.total || 0),
      }))
    : []
  const hasDailySalesData = dailySalesChartData.some((item) => item.total > 0 || item.count > 0)
  const hasExpenseData = expensesChartData.length > 0
  const totalRevenue30 = dailySalesChartData.reduce((sum, item) => sum + item.total, 0)
  const totalTransactions30 = dailySalesChartData.reduce((sum, item) => sum + item.count, 0)
  const avgRevenue30 = dailySalesChartData.length
    ? totalRevenue30 / dailySalesChartData.length
    : 0
  const peakDay = dailySalesChartData.reduce(
    (peak, item) => (item.total > peak.total ? item : peak),
    { dayLabel: 'N/A', total: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
          <p className="text-gray-600">Real-time overview of your business performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500">7-Day Growth</p>
            <div className="flex items-center space-x-1 mt-1">
              {growthPercentage >= 0 ? (
                <ArrowUp className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-semibold ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(growthPercentage)}%
              </span>
            </div>
          </div>
          <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500">Profit Margin</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{profitMargin}%</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(alerts?.low_stock_count > 0 || alerts?.overdue_credits > 0 || alerts?.negative_cashflow) && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Alerts Requiring Attention</h3>
              <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                {alerts.low_stock_count > 0 && (
                  <li>• {alerts.low_stock_count} product(s) are low on stock</li>
                )}
                {alerts.overdue_credits > 0 && (
                  <li>• {alerts.overdue_credits} overdue credit(s) need attention</li>
                )}
                {alerts.negative_cashflow && (
                  <li>• Negative cashflow detected - review your expenses</li>
                )}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Revenue"
          value={`ZMW ${formatNumber(summary?.total_revenue)}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Inflow"
          value={`ZMW ${formatNumber(summary?.total_inflow)}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Total Outflow"
          value={`ZMW ${formatNumber(summary?.total_outflow)}`}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Net Cash Flow"
          value={`ZMW ${formatNumber(summary?.net_cashflow)}`}
          icon={DollarSign}
          color={Number(summary?.net_cashflow) >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Outgoing Payments"
          value={`ZMW ${formatNumber(summary?.total_outgoing_payments)}`}
          icon={ArrowRightCircle}
          color="blue"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-gray-500">CUSTOMERS</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
          <p className="text-xs text-gray-500 mt-1">Total registered</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-medium text-gray-500">PRODUCTS</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          <p className="text-xs text-gray-500 mt-1">{lowStockProducts.length} low stock</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            <span className="text-xs font-medium text-gray-500">SALES</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalTransactions30}</p>
          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-5 h-5 text-yellow-600" />
            <span className="text-xs font-medium text-gray-500">CREDITS</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeCredits.length}</p>
          <p className="text-xs text-red-600 mt-1">{overdueCredits.length} overdue</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Percent className="w-5 h-5 text-primary-600" />
            <span className="text-xs font-medium text-gray-500">MARGIN</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{profitMargin}%</p>
          <p className="text-xs text-gray-500 mt-1">Profit margin</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-medium text-gray-500">GROWTH</span>
          </div>
          <p className={`text-2xl font-bold ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growthPercentage}%
          </p>
          <p className="text-xs text-gray-500 mt-1">vs last week</p>
        </div>
      </div>

      {/* Capital Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Cash Available"
          value={`ZMW ${formatNumber(summary?.cash_available)}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Inventory Value"
          value={`ZMW ${formatNumber(summary?.inventory_value)}`}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Credit Outstanding"
          value={`ZMW ${formatNumber(summary?.credit_outstanding)}`}
          icon={CreditCard}
          color="yellow"
        />
        <StatCard
          title="Reinvestments"
          value={`ZMW ${formatNumber(summary?.total_reinvestment)}`}
          icon={TrendingUp}
          color="primary"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h3>
          {hasDailySalesData ? (
            <>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={dailySalesChartData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="dayLabel" stroke="#9ca3af" minTickGap={20} tick={{ fontSize: 12 }} />
                  <YAxis
                    yAxisId="revenue"
                    stroke="#10b981"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `ZMW ${(Number(value) / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="transactions"
                    orientation="right"
                    stroke="#6366f1"
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: '#111827',
                    }}
                    formatter={(value, name) => {
                      if (name === 'Revenue' || name === '7-day Avg') {
                        return [`ZMW ${Number(value).toLocaleString()}`, name]
                      }
                      return [Number(value).toLocaleString(), name]
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    fill="url(#revenueTrendFill)"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="rollingAvg"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                    name="7-day Avg"
                  />
                  <Bar
                    yAxisId="transactions"
                    dataKey="count"
                    fill="#6366f1"
                    opacity={0.35}
                    barSize={12}
                    radius={[4, 4, 0, 0]}
                    name="Transactions"
                  />
                </ComposedChart>
              </ResponsiveContainer>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500">30-day Revenue</p>
                  <p className="mt-1 font-semibold text-gray-900">ZMW {totalRevenue30.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Avg / Day</p>
                  <p className="mt-1 font-semibold text-gray-900">ZMW {avgRevenue30.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Peak Day</p>
                  <p className="mt-1 font-semibold text-gray-900">{peakDay.dayLabel}</p>
                  <p className="text-xs text-gray-600">ZMW {Number(peakDay.total || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Transactions</p>
                  <p className="mt-1 font-semibold text-gray-900">{totalTransactions30.toLocaleString()}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
              No sales data yet. Add sales to populate this chart.
            </div>
          )}
        </Card>

        {/* Expenses by Category */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Expenses by Category
          </h3>
          {hasExpenseData ? (
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
              No expense categories yet. Add expenses to populate this chart.
            </div>
          )}
        </Card>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Products</h3>
          {topProductsData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topProductsData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    tick={{ fontSize: 11 }} 
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value, name) => [
                      name === 'revenue' ? `ZMW ${Number(value).toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : 'Quantity Sold'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 text-xs text-gray-500">
                Based on revenue generated
              </div>
            </>
          ) : (
            <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
              No sales data yet
            </div>
          )}
        </Card>

        {/* Inventory Health */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Health</h3>
          {products.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={inventoryHealthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {inventoryHealthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {inventoryHealthData.map((item, index) => (
                  <div key={index} className="rounded-lg bg-gray-50 p-2">
                    <p className="text-2xl font-bold" style={{ color: item.fill }}>{item.count}</p>
                    <p className="text-xs text-gray-600">{item.status}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
              No products yet
            </div>
          )}
        </Card>

        {/* Payment Types Distribution */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          {paymentTypeData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={paymentTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 text-xs text-gray-500 text-center">
                Recent sales payment distribution
              </div>
            </>
          ) : (
            <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
              No sales data yet
            </div>
          )}
        </Card>
      </div>

      {/* Credit Status Chart */}
      {credits.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Status Overview</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={creditStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="status" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {creditStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Best Day</p>
                  <p className="text-xs text-gray-600">{peakDay.dayLabel}</p>
                </div>
                <p className="text-lg font-bold text-green-600">ZMW {Number(peakDay.total || 0).toLocaleString()}</p>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Avg Daily Sales</p>
                  <p className="text-xs text-gray-600">Last 30 days</p>
                </div>
                <p className="text-lg font-bold text-blue-600">ZMW {avgRevenue30.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Total Transactions</p>
                  <p className="text-xs text-gray-600">Last 30 days</p>
                </div>
                <p className="text-lg font-bold text-purple-600">{totalTransactions30}</p>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Low Stock Alert</p>
                  <p className="text-xs text-gray-600">Products need restocking</p>
                </div>
                <p className="text-lg font-bold text-yellow-600">{lowStockProducts.length}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Sales
          </h3>
          <div className="space-y-3">
            {((recent_activity?.sales?.length) > 0) ? recent_activity.sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <ShoppingCart className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {sale.product_details?.name || 'Sale'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-green-600">
                  +ZMW {formatNumber(sale.total_amount)}
                </span>
              </div>
            )) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent sales</p>
            )}
          </div>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Expenses
          </h3>
          <div className="space-y-3">
            {((recent_activity?.expenses?.length) > 0) ? recent_activity.expenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {expense.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {expense.date ? new Date(expense.date).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-red-600">
                  -ZMW {formatNumber(expense.amount)}
                </span>
              </div>
            )) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent expenses</p>
            )}
          </div>
        </Card>

        {/* Recent Outgoing Payments */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Outgoing Payments
          </h3>
          <div className="space-y-3">
            {((recent_activity?.outgoing_payments?.length) > 0) ? recent_activity.outgoing_payments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <ArrowRightCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {payment.supplier || (payment.payment_type ? payment.payment_type.replace('_', ' ') : 'Payment')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {payment.transaction_date ? new Date(payment.transaction_date).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-red-600">
                  -ZMW {formatNumber(payment.amount)}
                </span>
              </div>
            )) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent outgoing payments</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
