import React, { useState, useEffect } from 'react'
import { Download, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { analyticsAPI } from '../services/api'

export default function CashFlowStatement() {
  const [statement, setStatement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('monthly')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    fetchStatement()
  }, [reportType, year, month])

  const fetchStatement = async () => {
    setLoading(true)
    try {
      const params = { period: reportType === 'monthly' ? 'month' : 'year' }
      const response = await analyticsAPI.getCashFlowStatement(params)
      setStatement(response.data)
    } catch (error) {
      console.error('Failed to fetch cash flow statement', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const params = { period: reportType === 'monthly' ? 'month' : 'year' }
      const response = await analyticsAPI.getCashFlowStatementPDF(params)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `cash-flow-statement-${reportType}-${year}${month ? '-' + String(month).padStart(2, '0') : ''}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to download PDF', error)
    }
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  // Safely get values with defaults
  const operatingActivities = statement?.operating_activities || {}
  const inflows = operatingActivities?.inflows || { total: 0, cash_sales: 0, mobile_money_sales: 0, credit_deposits_collected: 0 }
  const outflows = operatingActivities?.outflows || { total: 0, operating_expenses: 0, stock_purchases: 0, salaries: 0, rent: 0, utilities: 0, outgoing_payments: 0 }
  const investingActivities = statement?.investing_activities || {}
  const netCashFlow = statement?.summary?.net_cash_change || 0
  const isPositive = statement?.summary?.is_positive || netCashFlow >= 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cash Flow Statement</h1>
          <p className="text-gray-600 mt-1">Track your business cash inflows and outflows</p>
          {statement?.period?.label && (
            <p className="text-sm text-gray-500 mt-1">Period: {statement.period.label}</p>
          )}
        </div>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Download className="h-5 w-5" />
          Download PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {reportType === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {months.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {statement && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Inflow</p>
                  <p className="text-2xl font-bold text-green-600">
                    ZMW {Number(inflows.total || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Outflow</p>
                  <p className="text-2xl font-bold text-red-600">
                    ZMW {Number(outflows.total || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Calendar className={`h-6 w-6 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
                  <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    ZMW {Number(netCashFlow).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Statement Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inflow */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-green-50 px-6 py-4 border-b border-green-200">
                <h2 className="text-lg font-semibold text-green-900">Operating Cash Inflows</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Cash Sales</span>
                    <span className="font-medium text-gray-900">
                      ZMW {Number(inflows.cash_sales || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Mobile Money Sales</span>
                    <span className="font-medium text-gray-900">
                      ZMW {Number(inflows.mobile_money_sales || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Credit Deposits Collected</span>
                    <span className="font-medium text-gray-900">
                      ZMW {Number(inflows.credit_deposits_collected || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Inflow</span>
                    <span className="text-lg font-bold text-green-600">
                      ZMW {Number(inflows.total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Outflow */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-red-50 px-6 py-4 border-b border-red-200">
                <h2 className="text-lg font-semibold text-red-900">Operating Cash Outflows</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Stock Purchases</span>
                    <span className="font-medium text-gray-900">
                      ZMW {Number(outflows.stock_purchases || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Salaries & Wages</span>
                    <span className="font-medium text-gray-900">
                      ZMW {Number(outflows.salaries || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Rent</span>
                    <span className="font-medium text-gray-900">
                      ZMW {Number(outflows.rent || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Utilities</span>
                    <span className="font-medium text-gray-900">
                      ZMW {Number(outflows.utilities || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Outgoing Payments</span>
                    <span className="font-medium text-gray-900">
                      ZMW {Number(outflows.outgoing_payments || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Outflow</span>
                    <span className="text-lg font-bold text-red-600">
                      ZMW {Number(outflows.total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!isPositive && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Negative Cash Flow
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    Your outflows exceed your inflows for this period. Consider reviewing your expenses.
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
