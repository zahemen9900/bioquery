import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context-types'
import LoadingScreen from './LoadingScreen'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuth()
  const location = useLocation()

  if (!initialized || loading) {
    return <LoadingScreen message="Preparing your BioQuery cockpit…" />
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export default ProtectedRoute
