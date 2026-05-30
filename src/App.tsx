import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CoupleProvider } from './context/CoupleContext'
import { CoupleLayout } from './components/layout/CoupleLayout'
import { AlbumPage } from './pages/AlbumPage'
import { GamesPage } from './pages/GamesPage'
import { HomePage } from './pages/HomePage'
import { JoinPage } from './pages/JoinPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { PairPage } from './pages/PairPage'
import { ProfilePage } from './pages/ProfilePage'
import { isSupabaseConfigured } from './lib/supabase'

function ConfigWarning() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 lb-page">
      <div className="lb-card p-6 text-center space-y-3 max-w-md">
        <p className="text-lg font-display text-[var(--lb-accent)]">Supabase не настроен</p>
        <p className="text-sm text-[var(--lb-muted)]">
          Задайте secrets VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в GitHub Actions.
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
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pair" element={<PairPage />} />
            <Route path="/join/:id" element={<JoinPage />} />
            <Route element={<CoupleLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/album" element={<AlbumPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CoupleProvider>
      </AuthProvider>
    </HashRouter>
  )
}
