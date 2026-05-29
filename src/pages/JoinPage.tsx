import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCouple } from '../context/CoupleContext'
import { supabase } from '../lib/supabase'
import { friendlyNetworkError } from '../lib/network'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function JoinPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const { isComplete, joinCouple } = useCouple()
  const navigate = useNavigate()
  const [since, setSince] = useState('')
  const [inviteState, setInviteState] = useState<'loading' | 'ok' | 'creator' | 'bad'>('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !user) return

    supabase
      .from('couple_members')
      .select('role, couple_id')
      .eq('couple_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data: mine }) => {
        if (mine?.role === 'b') {
          navigate('/', { replace: true })
          return
        }
        if (mine?.role === 'a') {
          setInviteState('creator')
          return
        }

        supabase
          .from('couples')
          .select('id, status')
          .eq('id', id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.status === 'pending') setInviteState('ok')
            else setInviteState('bad')
          })
      })
  }, [id, user, navigate])

  if (!authLoading && !user) return <Navigate to={`/login?redirect=/join/${id}`} replace />
  if (isComplete) return <Navigate to="/" replace />

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !since) return
    setBusy(true)
    setError(null)
    const { error: err } = await joinCouple(id, since)
    setBusy(false)
    if (err) setError(friendlyNetworkError(err))
    else navigate('/')
  }

  if (inviteState === 'creator') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white/90 border border-rose-100 shadow-xl p-8 text-center space-y-4">
          <span className="text-4xl">💌</span>
          <h1 className="text-xl font-bold text-rose-700">Это ваша ссылка</h1>
          <p className="text-sm text-rose-800/70">
            Отправьте её партнёру в Telegram или WhatsApp. Сами по ней переходить не нужно.
          </p>
          <Button onClick={() => navigate('/pair')}>Вернуться</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleJoin}
        className="w-full max-w-md rounded-3xl bg-white/90 border border-rose-100 shadow-xl p-8 space-y-4"
      >
        <div className="text-center">
          <span className="text-4xl">💕</span>
          <h1 className="text-2xl font-bold text-rose-600 mt-2">Присоединиться к паре</h1>
        </div>
        <p className="text-sm text-rose-800/70 text-center">
          Выберите дату, с которой вы считаете, что вы вместе.
        </p>
        <Input type="date" value={since} onChange={(e) => setSince(e.target.value)} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {inviteState === 'bad' && (
          <p className="text-sm text-amber-600">
            Ссылка уже использована. Попросите партнёра создать новую пару.
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy || inviteState !== 'ok'}>
          {busy ? 'Связываем…' : 'Связаться'}
        </Button>
      </form>
    </div>
  )
}
