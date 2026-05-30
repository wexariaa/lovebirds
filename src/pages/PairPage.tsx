import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCouple } from '../context/CoupleContext'
import { DEFAULT_ACTIVITY_IDEAS } from '../lib/constants'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/layout/AppShell'
import { LoadingScreen } from '../components/ui/LoadingScreen'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function PairPage() {
  const { user, signOut } = useAuth()
  const { couple, isComplete, loading, resolved, createCouple, setTogetherSince } = useCouple()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [since, setSince] = useState('')
  const [copied, setCopied] = useState(false)

  if (!user) return <Navigate to="/login" replace />
  if (resolved && !loading && isComplete) return <Navigate to="/" replace />

  const inviteUrl =
    typeof window !== 'undefined' && couple?.id
      ? `${window.location.origin}${import.meta.env.BASE_URL}#/join/${couple.id}`
      : ''

  const handleCreate = async () => {
    setBusy(true)
    setError(null)
    const { coupleId, error: err } = await createCouple()
    setBusy(false)
    if (err) setError(err)
    else if (coupleId && user) {
      void Promise.all([
        supabase.from('activity_ideas').insert(
          DEFAULT_ACTIVITY_IDEAS.map((text) => ({
            couple_id: coupleId,
            text,
            is_custom: false,
          })),
        ),
        supabase.from('savings_goals').insert({ couple_id: coupleId }),
        supabase.from('tic_tac_toe_games').insert({
          couple_id: coupleId,
          board: Array(9).fill(''),
          current_turn: user.id,
          player_x: user.id,
          status: 'playing',
        }),
      ])
    }
  }

  const handleSetSince = async () => {
    if (!since) return
    setBusy(true)
    const { error: err } = await setTogetherSince(since)
    setBusy(false)
    if (err) setError(err)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if ((user && !resolved) || loading) {
    return <LoadingScreen hint="Загружаем пару…" />
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-rose-700 text-center">Свяжите ваши сердца</h1>

        {!couple ? (
          <div className="rounded-2xl bg-white/80 border border-rose-100 p-6 text-center space-y-4">
            <p className="text-rose-800/70 text-sm">
              Создайте пару и отправьте ссылку партнёру. Никакого поиска — только ваша ссылка.
            </p>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button onClick={handleCreate} disabled={busy} className="w-full">
              Создать пару
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/80 border border-rose-100 p-6 space-y-4">
            <p className="text-sm text-rose-800/70">
              Отправьте эту ссылку партнёру. Когда он присоединится, выберите дату «вместе с».
            </p>
            <div className="flex gap-2">
              <Input readOnly value={inviteUrl} className="text-xs" />
              <Button variant="secondary" onClick={copyLink}>
                {copied ? '✓' : 'Копировать'}
              </Button>
            </div>
            <p className="text-xs text-rose-500">Ожидаем партнёра…</p>
          </div>
        )}

        {couple && !isComplete && couple.together_since && (
          <p className="text-center text-sm text-rose-600">Партнёр скоро завершит настройку</p>
        )}

        {couple && couple.status === 'active' && !couple.together_since && (
          <div className="rounded-2xl bg-white/80 border border-rose-100 p-6 space-y-3">
            <label className="text-sm font-medium text-rose-700">Мы вместе с</label>
            <Input type="date" value={since} onChange={(e) => setSince(e.target.value)} />
            <Button onClick={handleSetSince} disabled={busy || !since} className="w-full">
              Сохранить дату
            </Button>
          </div>
        )}
      </div>
      <div className="text-center mt-8">
        <Button variant="ghost" onClick={() => signOut()}>
          Выйти из аккаунта
        </Button>
      </div>
    </AppShell>
  )
}
