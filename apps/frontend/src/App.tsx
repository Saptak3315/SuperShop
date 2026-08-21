import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import { Loader2 } from 'lucide-react'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ProductsPage } from './pages/inventory/ProductsPage'
import { POSPage } from './pages/sales/POSPage'
import { BulkIntakePage } from './pages/inventory/BulkIntakePage'

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Scoped Dashboard inside Layout wrapping */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pos"
        element={
          <ProtectedRoute>
            <Layout>
              <POSPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/bulk-intake"
        element={
          <ProtectedRoute>
            <Layout>
              <BulkIntakePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
