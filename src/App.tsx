import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CoupleProvider } from './context/CoupleContext'
import { DashboardPage } from './pages/DashboardPage'
import { JoinPage } from './pages/JoinPage'
import { LoginPage } from './pages/LoginPage'
import { PairPage } from './pages/PairPage'
import { isSupabaseConfigured } from './lib/supabase'

function ConfigWarning() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-rose-50">
      <div className="max-w-md rounded-2xl bg-white border border-rose-200 p-6 text-center space-y-3">
        <p className="text-lg font-semibold text-rose-700">Supabase не настроен</p>
        <p className="text-sm text-rose-800/70">
          На GitHub Pages не заданы secrets{' '}
          <code className="text-xs">VITE_SUPABASE_URL</code> и{' '}
          <code className="text-xs">VITE_SUPABASE_ANON_KEY</code>. Без них вход и связка не
          работают.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  if (!isSupabaseConfigured) return <ConfigWarning />

  return (
    <HashRouter>
      <AuthProvider>
        <CoupleProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pair" element={<PairPage />} />
            <Route path="/join/:id" element={<JoinPage />} />
            <Route path="/" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CoupleProvider>
      </AuthProvider>
    </HashRouter>
  )
}
