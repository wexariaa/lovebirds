import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { AppShell } from './AppShell'
import { LoadingScreen } from '../ui/LoadingScreen'

export function CoupleLayout() {
  const { user } = useAuth()
  const { isComplete, loading, resolved } = useCouple()

  if (!user) return <Navigate to="/login" replace />
  if (resolved && !loading && !isComplete) return <Navigate to="/pair" replace />
  if ((user && !resolved) || loading) {
    return <LoadingScreen hint="Загружаем пару…" />
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
