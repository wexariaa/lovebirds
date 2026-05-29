import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CoupleProvider } from './context/CoupleContext'
import { DashboardPage } from './pages/DashboardPage'
import { JoinPage } from './pages/JoinPage'
import { LoginPage } from './pages/LoginPage'
import { PairPage } from './pages/PairPage'

export default function App() {
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
