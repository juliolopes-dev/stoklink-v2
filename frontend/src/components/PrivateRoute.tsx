import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface PrivateRouteProps {
  children: React.ReactNode
  requiredRole?: 'ADMIN' | 'GERENTE' | 'CONFERENTE' | 'COMPRAS' | 'FINANCEIRO'
}

export function PrivateRoute({ children, requiredRole }: PrivateRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.perfil !== requiredRole && user?.perfil !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
