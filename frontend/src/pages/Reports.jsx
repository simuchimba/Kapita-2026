import { useState } from 'react'
import { FileText, Download } from 'lucide-react'
import Card from '../components/Card'
import { analyticsAPI } from '../services/api'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function normalizeReportData(data, fallbackType) {
  const d = data || {}
  if (!d.report_info) return null

  return {
    report_info: d.report_info,
    executive_summary: d.executive_summary || {},
    sales_analysis: d.sales_analysis || { top_products: [], by_payment_type: {}, daily_average: 0 },
    expense_analysis: d.expense_analysis || { by_category: {}, largest_expenses: [], expense_count: 0 },
    credit_analysis: d.credit_analysis || { top_debtors: [], credit_count: 0 },
    inventory_analysis: d.inventory_analysis || { low_stock_products: [] },
    customer_analysis: d.customer_analysis || { top_customers: [] },
    recommendations: d.recommendations || [],
    report_type: d.report_info.type || fallbackType,
    period: d.report_info.period || {},
    sales: d.executive_summary || {},
    expenses: d.expense_analysis || {},
    credits: d.credit_analysis || {},
    net_profit: d.executive_summary?.net_profit ?? 0,
  }
}

export default function Reports() {
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState('monthly')
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const formatMoney = (value, currency = 'ZMW') => `${currency} ${Number(value || 0).toLocaleString()}`
  const formatDate = (value) => {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString()
  }
  const buildFileName = (label, extension) => {
    const safeLabel = String(label || 'report').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '')
    return `Kapita_Report_${safeLabel}.${extension}`
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ].map((label, i) => ({ value: i + 1, label }))

  const generateReport = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { type: reportType }

      if (reportType === 'monthly') {
        params.month = selectedMonth
        params.year = selectedYear
      } else if (reportType === 'yearly') {
        params.year = selectedYear
      } else if (reportType === 'custom') {
        if (!customStart || !customEnd) {
          setError('Please select both start and end dates for a custom report.')
          setLoading(false)
          return
        }
        params.start_date = customStart
        params.end_date = customEnd
      }

      const response = await analyticsAPI.getComprehensiveReport(params)
      const normalized = normalizeReportData(response.data, reportType)
      if (!normalized) {
        throw new Error('Unexpected report format from server')
      }
      setReportData(normalized)
    } catch (err) {
      console.error('Failed to generate report:', err)
      const message = err.response?.data?.detail || err.message || 'Failed to generate report'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = async () => {
    if (!reportData) return

    const {
      report_info: info,
      executive_summary: summary,
      sales_analysis: sales,
      expense_analysis: expenses,
      credit_analysis: credits,
      inventory_analysis: inventory,
      customer_analysis: customers,
      recommendations,
    } = reportData

    const currency = info?.currency || 'ZMW'
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const paymentRows = Object.entries(sales?.by_payment_type || {})
    const expenseRows = Object.entries(expenses?.by_category || {})
    const recommendationsList = Array.isArray(recommendations) ? recommendations : []

    // Title page
    doc.setFillColor(15, 118, 110)
    doc.rect(0, 0, 210, 42, 'F')
    doc.setFillColor(230, 250, 245)
    doc.rect(0, 42, 210, 10, 'F')

    doc.setFontSize(22)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont(undefined, 'bold')
    doc.text('KAPITA', 14, 20)
    
    doc.setFontSize(11)
    doc.setFont(undefined, 'normal')
    doc.text('Smart Business Tracking & Analytics', 14, 28)

    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('Business Intelligence Report', 14, 38)

    doc.setTextColor(17, 24, 39)
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text('Business Performance Report', 14, 66)

    doc.setDrawColor(209, 213, 219)
    doc.roundedRect(14, 72, 182, 44, 3, 3)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('Business', 18, 80)
    doc.setFont(undefined, 'normal')
    doc.text(info?.business_name || 'Your Business', 18, 87)
    if (info?.address) doc.text(info.address, 18, 93)
    doc.text(`Period: ${info?.period?.label || 'Report Period'}`, 18, 101)
    doc.text(`Generated: ${formatDate(info?.generated_at)}`, 18, 108)

    const contactParts = [info?.phone, info?.email, info?.website].filter(Boolean)
    if (contactParts.length) {
      doc.setFontSize(9)
      doc.text(contactParts.join(' | '), 18, 114)
    }

    const regParts = [
      info?.tin && `TIN: ${info.tin}`,
      info?.vat_number && `VAT: ${info.vat_number}`,
      info?.business_registration_number && `Reg: ${info.business_registration_number}`,
    ].filter(Boolean)
    if (regParts.length) {
      doc.setFontSize(9)
      doc.text(regParts.join('  •  '), 18, 120)
    }

    const tileWidth = 56
    const tileHeight = 24
    const tileYStart = 132
    const tiles = [
      { label: 'Revenue', value: formatMoney(summary?.total_sales, currency), color: [16, 185, 129] },
      { label: 'Expenses', value: formatMoney(summary?.total_expenses, currency), color: [239, 68, 68] },
      { label: 'Net Profit', value: formatMoney(summary?.net_profit, currency), color: [37, 99, 235] },
      { label: 'Transactions', value: String(summary?.transaction_count || 0), color: [124, 58, 237] },
      { label: 'Outstanding Credit', value: formatMoney(credits?.outstanding, currency), color: [217, 119, 6] },
      { label: 'Profit Margin', value: `${Number(summary?.profit_margin || 0).toFixed(2)}%`, color: [6, 95, 70] },
    ]

    tiles.forEach((tile, index) => {
      const row = Math.floor(index / 3)
      const col = index % 3
      const x = 14 + col * (tileWidth + 7)
      const y = tileYStart + row * (tileHeight + 8)

      doc.setDrawColor(229, 231, 235)
      doc.roundedRect(x, y, tileWidth, tileHeight, 3, 3)
      doc.setFillColor(tile.color[0], tile.color[1], tile.color[2])
      doc.rect(x, y, tileWidth, 5, 'F')

      doc.setTextColor(75, 85, 99)
      doc.setFontSize(8)
      doc.setFont(undefined, 'bold')
      doc.text(tile.label.toUpperCase(), x + 3, y + 10)

      doc.setTextColor(17, 24, 39)
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      const valueLines = doc.splitTextToSize(tile.value, tileWidth - 6)
      doc.text(valueLines[0] || '-', x + 3, y + 17)
    })

    doc.setTextColor(75, 85, 99)
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.text('Prepared by Kapita Analytics. This report is generated from live records in your Kapita account.', 14, 205)
    doc.text('Use this report to review trends, spot risks early, and make better business decisions.', 14, 211)

    // Executive summary
    doc.addPage()
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Executive Summary', 14, 20)

    autoTable(doc, {
      startY: 28,
      head: [['Metric', 'Value']],
      body: [
        ['Total Sales', formatMoney(summary?.total_sales, currency)],
        ['Total Profit', formatMoney(summary?.total_profit, currency)],
        ['Total Expenses', formatMoney(summary?.total_expenses, currency)],
        ['Net Profit', formatMoney(summary?.net_profit, currency)],
        ['Profit Margin', `${Number(summary?.profit_margin || 0).toFixed(2)}%`],
        ['Transactions', summary?.transaction_count || 0],
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
    })

    // Sales
    doc.addPage()
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Sales Analysis', 14, 20)
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Total Sales: ${formatMoney(sales?.total_sales, currency)}`, 14, 30)
    doc.text(`Daily Average: ${formatMoney(sales?.daily_average, currency)}`, 14, 37)

    autoTable(doc, {
      startY: 44,
      head: [['Payment Type', 'Amount']],
      body: paymentRows.map(([type, amount]) => [
        type.replace(/_/g, ' ').toUpperCase(),
        formatMoney(amount, currency),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
    })

    if ((sales?.top_products || []).length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Top Products', 'Qty', 'Revenue']],
        body: sales.top_products.map((p) => [
          p.name || 'Unknown',
          p.quantity || 0,
          formatMoney(p.revenue, currency),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
      })
    }

    // Expenses
    doc.addPage()
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Expense Analysis', 14, 20)
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Total Expenses: ${formatMoney(expenses?.total_expenses, currency)}`, 14, 30)

    autoTable(doc, {
      startY: 38,
      head: [['Category', 'Amount']],
      body: expenseRows
        .filter(([, amount]) => Number(amount) > 0)
        .map(([category, amount]) => [
          category.replace(/_/g, ' ').toUpperCase(),
          formatMoney(amount, currency),
        ]),
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] },
    })

    if ((expenses?.largest_expenses || []).length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Largest Expenses', 'Category', 'Amount', 'Date']],
        body: expenses.largest_expenses.slice(0, 10).map((e) => [
          e.title || 'Expense',
          (e.category || 'N/A').replace(/_/g, ' '),
          formatMoney(e.amount, currency),
          formatDate(e.date),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] },
      })
    }

    // Credits
    doc.addPage()
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Credit Analysis', 14, 20)

    autoTable(doc, {
      startY: 28,
      head: [['Metric', 'Value']],
      body: [
        ['Total Credit Issued', formatMoney(credits?.total_issued, currency)],
        ['Total Collected', formatMoney(credits?.total_collected, currency)],
        ['Outstanding', formatMoney(credits?.outstanding, currency)],
        ['Collection Rate', `${Number(credits?.collection_rate || 0).toFixed(2)}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [251, 191, 36] },
    })

    if ((credits?.top_debtors || []).length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Top Debtors', 'Amount Owed', 'Status', 'Due Date']],
        body: credits.top_debtors.map((d) => [
          d.customer || 'N/A',
          formatMoney(d.amount_owed, currency),
          String(d.status || 'unknown').toUpperCase(),
          d.due_date ? formatDate(d.due_date) : 'N/A',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [251, 191, 36] },
      })
    }

    // Inventory & customers
    doc.addPage()
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Inventory & Customers', 14, 20)

    autoTable(doc, {
      startY: 28,
      head: [['Inventory Metric', 'Value']],
      body: [
        ['Total Products', inventory?.total_products || 0],
        ['Inventory Value', formatMoney(inventory?.inventory_value, currency)],
        ['Low Stock Items', inventory?.low_stock_count || 0],
        ['Total Customers', customers?.total_customers || 0],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    })

    if ((customers?.top_customers || []).length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Top Customers', 'Purchases', 'Transactions']],
        body: customers.top_customers.map((c) => [
          c.name || 'Customer',
          formatMoney(c.total_purchases, currency),
          c.transaction_count || 0,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] },
      })
    }

    if (recommendationsList.length > 0) {
      doc.addPage()
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.text('Recommendations', 14, 20)
      let yPos = 32
      recommendationsList.forEach((rec, index) => {
        doc.setFontSize(11)
        doc.setFont(undefined, 'bold')
        doc.text(`${index + 1}. ${rec.title || 'Recommendation'}`, 14, yPos)
        doc.setFont(undefined, 'normal')
        const lines = doc.splitTextToSize(rec.message || '', 180)
        doc.text(lines, 14, yPos + 6)
        yPos += 6 + lines.length * 5 + 6
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
      })
    }

    doc.save(buildFileName(info?.period?.label, 'pdf'))
  }

  const exportToCSV = () => {
    if (!reportData) return
    const { report_info: info, executive_summary: summary, sales_analysis: sales, expense_analysis: expenses } = reportData

    let csv = 'Kapita Business Report\n'
    csv += `${info?.business_name || ''}\n`
    csv += `Period,${info?.period?.label || ''}\n`
    csv += `Generated,${formatDate(info?.generated_at)}\n\n`
    csv += 'Executive Summary\nMetric,Value\n'
    csv += `Total Sales,${summary?.total_sales || 0}\n`
    csv += `Total Profit,${summary?.total_profit || 0}\n`
    csv += `Total Expenses,${summary?.total_expenses || 0}\n`
    csv += `Net Profit,${summary?.net_profit || 0}\n`
    csv += `Profit Margin,${summary?.profit_margin || 0}%\n`
    csv += `Transactions,${summary?.transaction_count || 0}\n\n`
    csv += 'Sales by Payment Type\nPayment Type,Amount\n'
    Object.entries(sales?.by_payment_type || {}).forEach(([type, amount]) => {
      csv += `${type},${amount}\n`
    })
    csv += '\nExpenses by Category\nCategory,Amount\n'
    Object.entries(expenses?.by_category || {}).forEach(([category, amount]) => {
      csv += `${category},${amount}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = buildFileName(info?.period?.label, 'csv')
    a.click()
  }

  const currency = reportData?.report_info?.currency || 'ZMW'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate business performance reports and export to PDF or CSV</p>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h3>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="label">Report Type</label>
            <select className="input" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="monthly">Monthly Report</option>
              <option value="yearly">Yearly Report</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {reportType === 'monthly' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Month</label>
                <select className="input" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}>
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <select className="input" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}>
                  {[2024, 2025, 2026, 2027].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {reportType === 'yearly' && (
            <div>
              <label className="label">Year</label>
              <select className="input" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}>
                {[2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Start Date</label>
                <input type="date" className="input" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" className="input" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={generateReport}
            disabled={loading}
            className="btn btn-primary flex items-center space-x-2 w-full justify-center"
          >
            <FileText className="w-5 h-5" />
            <span>{loading ? 'Generating...' : 'Generate Report'}</span>
          </button>
        </div>
      </Card>

      {reportData && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {(reportData.report_type || 'Business').charAt(0).toUpperCase() + (reportData.report_type || 'business').slice(1)} Report
            </h3>
            <div className="flex space-x-2">
              <button type="button" onClick={exportToPDF} className="btn btn-secondary flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>
              <button type="button" onClick={exportToCSV} className="btn btn-secondary flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Report Period</h4>
              <p className="text-gray-600">
                {formatDate(reportData.period?.start)} – {formatDate(reportData.period?.end)}
              </p>
              <p className="text-sm text-gray-500 mt-1">{reportData.report_info?.business_name}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Sales Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-green-600">{formatMoney(reportData.sales?.total_sales, currency)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Profit</p>
                  <p className="text-2xl font-bold text-blue-600">{formatMoney(reportData.sales?.total_profit, currency)}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-purple-600">{reportData.sales?.transaction_count || 0}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Expenses Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">{formatMoney(reportData.expenses?.total_expenses, currency)}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Expense Count</p>
                  <p className="text-2xl font-bold text-yellow-600">{reportData.expenses?.expense_count || 0}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Credits Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Issued</p>
                  <p className="text-2xl font-bold text-gray-900">{formatMoney(reportData.credits?.total_issued, currency)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Collected</p>
                  <p className="text-2xl font-bold text-gray-900">{formatMoney(reportData.credits?.total_collected, currency)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Credit Count</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.credits?.credit_count || 0}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-primary-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Net Profit</h4>
              <p className={`text-3xl font-bold ${reportData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMoney(reportData.net_profit, currency)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
