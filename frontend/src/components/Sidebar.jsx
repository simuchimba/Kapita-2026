import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  BarChart3, 
  FileText, 
  Settings,
  LineChart,
  MessageSquare,
  ShieldCheck,
  Wallet,
  X,
  Tag,
  PackageOpen,
  UserPlus,
  ArrowRightCircle,
  TrendingDown,
  Currency,
  Cloud,
  ScanLine,
  FileSpreadsheet,
} from 'lucide-react'

const businessNavigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/app/products', icon: Package },
  { name: 'Sales', href: '/app/sales', icon: ShoppingCart },
  { name: 'Invoices', href: '/app/invoices', icon: FileSpreadsheet },
  { name: 'Quotations', href: '/app/quotations', icon: FileText },
  { name: 'Promotions', href: '/app/promotions', icon: Tag },
  { name: 'Suppliers', href: '/app/suppliers', icon: UserPlus },
  { name: 'Purchase Orders', href: '/app/purchase-orders', icon: PackageOpen },
  { name: 'Customers', href: '/app/customers', icon: Users },
  { name: 'Credits', href: '/app/credits', icon: CreditCard },
  { name: 'Expenses', href: '/app/expenses', icon: Receipt },
  { name: 'Reinvestments', href: '/app/reinvestments', icon: TrendingUp },
  { name: 'Outgoing Payments', href: '/app/outgoing-payments', icon: ArrowRightCircle },
  { name: 'Cash Flow', href: '/app/cash-flow', icon: TrendingDown },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
  { name: 'Projections', href: '/app/projections', icon: LineChart },
  { name: 'Reports', href: '/app/reports', icon: FileText },
  { name: 'Currencies', href: '/app/currencies', icon: Currency },
  { name: 'Backup & Restore', href: '/app/backup', icon: Cloud },
]

const personalNavigation = [
  { name: 'Personal Finance', href: '/app/personal', icon: Wallet },
]

const accountNavigation = [
  { name: 'Billing & Access', href: '/app/billing', icon: ShieldCheck },
  { name: 'Mumu', href: '/app/chat', icon: MessageSquare },
  { name: 'Settings', href: '/app/settings', icon: Settings },
]

function NavLink({ item, isActive, onNavigate }) {
  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={`
        flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
        ${isActive 
          ? 'bg-primary-50 text-primary-600' 
          : 'text-gray-700 hover:bg-gray-100'
        }
      `}
    >
      <item.icon className="w-5 h-5" />
      <span className="font-medium">{item.name}</span>
    </Link>
  )
}

function PersonalNavLink({ item, isActive, onNavigate }) {
  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={`
        flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
        ${isActive 
          ? 'bg-violet-50 text-violet-600' 
          : 'text-gray-700 hover:bg-violet-50/50'
        }
      `}
    >
      <item.icon className="w-5 h-5" />
      <span className="font-medium">{item.name}</span>
    </Link>
  )
}

export default function Sidebar({ open, setOpen }) {
  const location = useLocation()
  const close = () => setOpen(false)

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={close}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link to="/app/dashboard" className="flex items-center">
              <img 
                src="/logo1.png" 
                alt="Kapita Logo" 
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextElementSibling.style.display = 'flex'
                }}
              />
              <div className="w-10 h-10 bg-primary-600 rounded-lg items-center justify-center hidden">
                <span className="text-white font-bold text-xl">K</span>
              </div>
            </Link>
            <button
              onClick={close}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            <div>
              <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Business
              </p>
              <div className="space-y-1">
                {businessNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    item={item}
                    isActive={location.pathname === item.href}
                    onNavigate={close}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-violet-500">
                Personal
              </p>
              <div className="space-y-1">
                {personalNavigation.map((item) => (
                  <PersonalNavLink
                    key={item.name}
                    item={item}
                    isActive={location.pathname === item.href}
                    onNavigate={close}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Account
              </p>
              <div className="space-y-1">
                {accountNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    item={item}
                    isActive={location.pathname === item.href}
                    onNavigate={close}
                  />
                ))}
              </div>
            </div>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Business & personal, kept separate
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
