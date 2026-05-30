import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCouple } from '../context/CoupleContext'
import { supabase } from '../lib/supabase'
import { friendlyNetworkError } from '../lib/network'
import { SetupShell } from '../components/layout/SetupShell'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

type InviteState = 'loading' | 'ok' | 'creator' | 'blocked' | 'ready'

export function JoinPage() {
  const { id } = useParams<{ id: string }>()
  const { user, signOut } = useAuth()
  const { isComplete, joinCouple } = useCouple()
  const navigate = useNavigate()
  const [since, setSince] = useState('')
  const [inviteState, setInviteState] = useState<InviteState>('loading')
  const [statusHint, setStatusHint] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkInvite = async (coupleId: string) => {
    setInviteState('loading')
    setStatusHint(null)
    setError(null)

    await supabase.rpc('abandon_solo_pending_couple')

    const { data, error: rpcErr } = await supabase.rpc('check_invite_status', {
      p_couple_id: coupleId,
    })

    if (rpcErr) {
      const missing =
        rpcErr.message.includes('check_invite_status') || rpcErr.message.includes('PGRST202')
      if (missing) {
        setInviteState('ready')
        setStatusHint('Проверка ссылки недоступна — можно попробовать связаться.')
        return
      }
      setInviteState('ready')
      setStatusHint('Не удалось проверить — нажмите «Связаться» или обновите страницу.')
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
        navigate('/home', { replace: true })
        break
      case 'in_other_couple':
        setInviteState('blocked')
        setStatusHint(
          'Вы уже в активной паре. Выйдите или нажмите «Расстались» в профиле, если нужно сменить аккаунт.',
        )
        break
      case 'not_found':
        setInviteState('blocked')
        setStatusHint('Ссылка не найдена. Попросите партнёра создать новую пару.')
        break
      case 'not_pending':
      case 'full':
        setInviteState('blocked')
        setStatusHint('Ссылка уже использована. Попросите партнёра создать новую пару.')
        break
      default:
        setInviteState('ready')
        setStatusHint('Можно попробовать связаться — ваша пустая ссылка заменится автоматически.')
    }
  }

  useEffect(() => {
    if (!id || !user) return
    void checkInvite(id)
  }, [id, user])

  if (!user) return <Navigate to={`/login?redirect=/join/${id}`} replace />
  if (isComplete) return <Navigate to="/home" replace />

  const canSubmit =
    Boolean(since && id) && !busy && inviteState !== 'creator' && inviteState !== 'blocked'

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !since) return
    setBusy(true)
    setError(null)
    await supabase.rpc('abandon_solo_pending_couple')
    const { error: err } = await joinCouple(id, since)
    setBusy(false)
    if (err) setError(friendlyNetworkError(err))
    else navigate('/home')
  }

  if (inviteState === 'creator') {
    return (
      <SetupShell>
        <div className="lb-card p-8 text-center space-y-4">
          <span className="text-4xl">💌</span>
          <h1 className="font-display text-xl text-[var(--lb-text)]">Это ваша ссылка</h1>
          <p className="text-sm text-[var(--lb-muted)]">
            Отправьте её партнёру. Сами по ней переходить не нужно.
          </p>
          <Button onClick={() => navigate('/pair')}>К моей паре</Button>
          <Button variant="ghost" className="w-full" onClick={() => signOut()}>
            Выйти
          </Button>
        </div>
      </SetupShell>
    )
  }

  return (
    <SetupShell>
      <form onSubmit={handleJoin} className="lb-card p-8 space-y-4">
        <div className="text-center">
          <span className="text-4xl">💕</span>
          <h1 className="font-display text-2xl text-[var(--lb-accent)] mt-2">
            Присоединиться к паре
          </h1>
        </div>
        <p className="text-sm text-[var(--lb-muted)] text-center">
          Выберите дату, с которой вы считаете, что вы вместе.
        </p>
        {inviteState === 'loading' && (
          <p className="text-sm text-[var(--lb-muted)] text-center">Проверяем ссылку…</p>
        )}
        <Input type="date" value={since} onChange={(e) => setSince(e.target.value)} required />
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
        {statusHint && inviteState !== 'loading' && (
          <p
            className={`text-sm rounded-xl px-3 py-2 ${
              inviteState === 'blocked'
                ? 'text-amber-900 bg-amber-50 border border-amber-100'
                : 'text-[var(--lb-muted)] bg-[var(--lb-accent-soft)]/50'
            }`}
          >
            {statusHint}
          </p>
        )}
        <Button type="submit" className="w-full !rounded-full" disabled={!canSubmit}>
          {busy ? 'Связываем…' : 'Связаться'}
        </Button>
        <div className="flex flex-col gap-2 pt-2">
          {id && (
            <Button type="button" variant="secondary" className="w-full" onClick={() => checkInvite(id)}>
              Проверить ссылку снова
            </Button>
          )}
          <Button type="button" variant="ghost" className="w-full" onClick={() => signOut()}>
            Выйти из аккаунта
          </Button>
        </div>
      </form>
    </SetupShell>
  )
}
