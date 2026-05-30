import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { validateDisplayName, validateLogin } from '../lib/auth-login'
import { PublicHeader } from '../components/layout/PublicHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function LoginPage() {
  const { user, signIn, signUp } = useAuth()
  const [searchParams] = useSearchParams()
  const afterLogin = searchParams.get('redirect') || '/home'
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login'
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) setBusy(false)
  }, [user])

  if (user) return <Navigate to={afterLogin} replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const loginErr = validateLogin(login)
    if (loginErr) {
      setError(loginErr)
      return
    }
    if (mode === 'register') {
      const nameErr = validateDisplayName(name)
      if (nameErr) {
        setError(nameErr)
        return
      }
    }

    setBusy(true)
    const res =
      mode === 'login'
        ? await signIn(login, password)
        : await signUp(login, password, name.trim())
    if (res.error) {
      setError(res.error)
      setBusy(false)
      return
    }
    setBusy(false)
  }

  return (
    <div className="min-h-screen lb-page flex flex-col">
      <PublicHeader showAuth={false} />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md lb-card p-8">
          <div className="text-center mb-8">
            <p className="font-script text-3xl text-[var(--lb-accent)]">Lovebirds</p>
            <p className="text-[var(--lb-muted)] mt-1 text-sm">Только для вас двоих</p>
          </div>

          <div className="flex rounded-xl bg-[var(--lb-bg)] p-1 mb-6">
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'login'
                  ? 'bg-[var(--lb-accent)] text-white'
                  : 'text-[var(--lb-muted)]'
              }`}
              onClick={() => setMode('login')}
            >
              Вход
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'register'
                  ? 'bg-[var(--lb-accent)] text-white'
                  : 'text-[var(--lb-muted)]'
              }`}
              onClick={() => setMode('register')}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="lb-label">Имя</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Как вас звать" />
              </div>
            )}
            <div>
              <label className="lb-label">Логин</label>
              <Input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                autoComplete="username"
                placeholder="latin_letters_123"
              />
            </div>
            <div>
              <label className="lb-label">Пароль</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full !rounded-full" disabled={busy}>
              {busy ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </Button>
          </form>

          <button
            type="button"
            className="w-full mt-4 text-sm text-[var(--lb-accent)] hover:underline"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Нет аккаунта? Регистрация' : 'Уже есть аккаунт? Войти'}
          </button>
          <Link to="/" className="block text-center mt-4 text-xs text-[var(--lb-muted)] hover:underline">
            ← На главную
          </Link>
        </div>
      </div>
    </div>
  )
}
