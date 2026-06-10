import { useEffect, useState } from 'react'
import { TrendingUp, DollarSign, Calendar, AlertCircle } from 'lucide-react'
import Card, { StatCard } from '../components/Card'
import Loading from '../components/Loading'
import { analyticsAPI } from '../services/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Projections() {
  const [loading, setLoading] = useState(true)
  const [projections, setProjections] = useState(null)
  const [timeframe, setTimeframe] = useState('30') // 30, 60, 90 days or monthly
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

  useEffect(() => {
    fetchProjections()
  }, [timeframe])

  const fetchProjections = async () => {
    try {
      const response = await analyticsAPI.getProjections({ days: timeframe })
      setProjections(response.data)
    } catch (error) {
      console.error('Failed to fetch projections:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading fullScreen />

  const { current_metrics, averages, projections_30_days, daily_trend, insights } = projections || {}
  const chartData = Array.isArray(daily_trend)
    ? daily_trend.map((item) => ({
        ...item,
        dayLabel: formatChartDay(item?.day),
        total: Number(item?.total || 0),
      }))
    : []
  const hasTrendData = chartData.length > 0

  // Calculate monthly projections
  const monthlyProjections = timeframe === 'monthly' ? {
    projected_revenue: averages?.avg_transaction * 30,
    projected_expenses: averages?.avg_expense * 30,
    projected_profit: (averages?.avg_transaction * 30) - (averages?.avg_expense * 30)
  } : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Projections</h1>
          <p className="text-gray-600">Forecast your business performance</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="input w-auto"
          >
            <option value="30">30 Days</option>
            <option value="60">60 Days</option>
            <option value="90">90 Days</option>
            <option value="monthly">Monthly View</option>
          </select>
        </div>
      </div>

      {/* Insights Alert */}
      {insights && (
        <Card className={`${
          insights.is_profitable 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start space-x-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 ${
              insights.is_profitable ? 'text-green-600' : 'text-red-600'
            }`} />
            <div>
              <h3 className={`font-semibold ${
                insights.is_profitable ? 'text-green-900' : 'text-red-900'
              }`}>
                {insights.is_profitable ? 'Profitable Projection' : 'Loss Projection'}
              </h3>
              <p className={`text-sm mt-1 ${
                insights.is_profitable ? 'text-green-800' : 'text-red-800'
              }`}>
                Based on current trends, your business is projected to {insights.is_profitable ? 'make' : 'lose'} ZMW {Math.abs(projections_30_days?.projected_profit || 0).toLocaleString()} over the next {timeframe === 'monthly' ? 'month' : `${timeframe} days`}.
                {insights.profit_margin > 0 && ` Profit margin: ${insights.profit_margin.toFixed(1)}%`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Current Performance */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Sales"
            value={`ZMW ${current_metrics?.total_sales?.toLocaleString() || 0}`}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Total Expenses"
            value={`ZMW ${current_metrics?.total_expenses?.toLocaleString() || 0}`}
            icon={DollarSign}
            color="red"
          />
          <StatCard
            title="Net Profit"
            value={`ZMW ${current_metrics?.total_profit?.toLocaleString() || 0}`}
            icon={TrendingUp}
            color="blue"
          />
        </div>
      </div>

      {/* Averages */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Average Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Transaction</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ZMW {averages?.avg_transaction?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Based on {current_metrics?.sales_count || 0} transactions
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Expense</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ZMW {averages?.avg_expense?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Based on {current_metrics?.expense_count || 0} expenses
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Projections */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {timeframe === 'monthly' ? 'Monthly' : `${timeframe}-Day`} Projections
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Projected Revenue"
            value={`ZMW ${projections_30_days?.projected_revenue?.toLocaleString() || 0}`}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Projected Expenses"
            value={`ZMW ${projections_30_days?.projected_expenses?.toLocaleString() || 0}`}
            icon={DollarSign}
            color="red"
          />
          <StatCard
            title="Projected Profit"
            value={`ZMW ${projections_30_days?.projected_profit?.toLocaleString() || 0}`}
            icon={TrendingUp}
            color={projections_30_days?.projected_profit >= 0 ? 'blue' : 'red'}
          />
          <StatCard
            title="Outstanding Credit"
            value={`ZMW ${projections_30_days?.outstanding_credit?.toLocaleString() || 0}`}
            icon={DollarSign}
            color="yellow"
          />
        </div>
      </div>

      {/* Expected Income */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Expected Total Income
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Projected Revenue</span>
            <span className="font-semibold text-gray-900">
              ZMW {projections_30_days?.projected_revenue?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Outstanding Credit Collection</span>
            <span className="font-semibold text-gray-900">
              ZMW {projections_30_days?.outstanding_credit?.toLocaleString() || 0}
            </span>
          </div>
          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Expected Total Income</span>
              <span className="font-bold text-primary-600 text-xl">
                ZMW {projections_30_days?.expected_income?.toLocaleString() || 0}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              If all outstanding credits are collected
            </p>
          </div>
        </div>
      </Card>

      {/* Sales Trend */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sales Trend (Last 30 Days)
        </h3>
        {hasTrendData ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="dayLabel" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#111827',
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Daily Sales"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
            No sales trend data yet. Create sales to populate this chart.
          </div>
        )}
      </Card>

      {/* Recommendations */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recommendations
        </h3>
        <div className="space-y-3">
          {insights?.is_profitable ? (
            <>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <p className="text-gray-700">
                  Your business is on a profitable trajectory. Consider reinvesting some profits to grow further.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <p className="text-gray-700">
                  Focus on collecting outstanding credits to improve cash flow by ZMW {insights?.credit_recovery_impact?.toLocaleString()}.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                <p className="text-gray-700">
                  Review your expenses and identify areas where you can reduce costs.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                <p className="text-gray-700">
                  Consider strategies to increase sales volume or average transaction value.
                </p>
              </div>
            </>
          )}
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
            <p className="text-gray-700">
              Monitor your daily sales trend and adjust your strategy based on patterns.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
