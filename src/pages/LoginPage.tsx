import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth()
  const [searchParams] = useSearchParams()
  const afterLogin = searchParams.get('redirect') || '/pair'
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) setBusy(false)
  }, [user])

  if (!loading && user) return <Navigate to={afterLogin} replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const res =
      mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, name)
    if (res.error) {
      setError(res.error)
      setBusy(false)
      return
    }
    if (mode === 'register') {
      setError('Аккаунт создан. Если не перенаправило — нажмите «Войти» с тем же email и паролем.')
      setBusy(false)
    }
    // login: busy остаётся true до редиректа (см. useEffect выше)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white/90 border border-rose-100 shadow-xl p-8">
        <div className="text-center mb-8">
          <span className="text-5xl">❤️</span>
          <h1 className="text-3xl font-bold text-rose-600 mt-2">Lovebirds</h1>
          <p className="text-rose-800/60 mt-1 text-sm">Только для вас двоих</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-medium text-rose-700/80 mb-1 block">Имя</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-rose-700/80 mb-1 block">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-rose-700/80 mb-1 block">Пароль</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy || loading}>
            {busy ? 'Входим…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </form>

        <button
          type="button"
          className="w-full mt-4 text-sm text-rose-600 hover:underline"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Нет аккаунта? Регистрация' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  )
}
