import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  PlusCircle,
  LogOut,
  Store,
} from 'lucide-react'

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products & Batches', path: '/products', icon: Package },
    { name: 'POS Checkout', path: '/pos', icon: ShoppingCart },
    { name: 'Bulk Intake', path: '/bulk-intake', icon: PlusCircle },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 truncate">
                {user?.storeName || 'Super Shop'}
              </h2>
              <span className="text-xs text-gray-500 capitalize">
                {user?.role?.toLowerCase() || 'Owner'} Portal
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                Role: {user?.role?.toLowerCase()}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
