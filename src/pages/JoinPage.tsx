import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCouple } from '../context/CoupleContext'
import { supabase } from '../lib/supabase'
import { friendlyNetworkError } from '../lib/network'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
type InviteState =
  | 'loading'
  | 'ok'
  | 'creator'
  | 'bad'
  | 'in_other_couple'
  | 'unknown'

export function JoinPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { isComplete, joinCouple } = useCouple()
  const navigate = useNavigate()
  const [since, setSince] = useState('')
  const [inviteState, setInviteState] = useState<InviteState>('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !user) return

    let cancelled = false
    setInviteState('loading')

    const fallbackTimer = setTimeout(() => {
      if (!cancelled) {
        setInviteState((prev) => (prev === 'loading' ? 'unknown' : prev))
      }
    }, 6000)

    void (async () => {
      try {
        const { data, error: rpcErr } = await supabase.rpc('check_invite_status', {
          p_couple_id: id,
        })
        if (cancelled) return

        if (rpcErr) {
          const missing =
            rpcErr.message.includes('check_invite_status') ||
            rpcErr.message.includes('PGRST202')
          setInviteState(missing ? 'unknown' : 'bad')
          return
        }

        switch (data) {
          case 'ok':
            setInviteState('ok')
            break
          case 'creator':
            setInviteState('creator')
            break
          case 'already_member':
            navigate('/', { replace: true })
            break
          case 'in_other_couple':
            setInviteState('in_other_couple')
            break
          case 'not_found':
          case 'not_pending':
          case 'full':
            setInviteState('bad')
            break
          default:
            setInviteState('unknown')
        }
      } catch {
        if (!cancelled) setInviteState('unknown')
      } finally {
        clearTimeout(fallbackTimer)
      }
    })()

    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
    }
  }, [id, user, navigate])

  if (!user) return <Navigate to={`/login?redirect=/join/${id}`} replace />
  if (isComplete) return <Navigate to="/" replace />

  const canSubmit =
    Boolean(since && id) &&
    !busy &&
    inviteState !== 'creator' &&
    inviteState !== 'in_other_couple' &&
    inviteState !== 'bad'

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
        {inviteState === 'loading' && (
          <p className="text-sm text-rose-500 text-center">Проверяем ссылку…</p>
        )}
        <Input type="date" value={since} onChange={(e) => setSince(e.target.value)} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {inviteState === 'bad' && (
          <p className="text-sm text-amber-600">
            Ссылка уже использована или не найдена. Попросите партнёра создать новую пару.
          </p>
        )}
        {inviteState === 'in_other_couple' && (
          <p className="text-sm text-amber-600">
            Вы уже в другой паре. Выйдите и войдите другим аккаунтом или нажмите «Расстались» на
            главной.
          </p>
        )}
        {inviteState === 'unknown' && (
          <p className="text-sm text-rose-500 text-center">
            Не удалось проверить ссылку — можно попробовать связаться.
          </p>
        )}
        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {busy ? 'Связываем…' : 'Связаться'}
        </Button>
      </form>
    </div>
  )
}
