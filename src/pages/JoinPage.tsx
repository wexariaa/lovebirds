import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCouple } from '../context/CoupleContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

import { friendlyNetworkError } from '../lib/network'

function joinErrorMessage(msg: string): string {
  return friendlyNetworkError(msg)
}

export function JoinPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const { isComplete, joinCouple } = useCouple()
  const navigate = useNavigate()
  const [since, setSince] = useState('')
  const [valid, setValid] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    supabase
      .from('couples')
      .select('id, status')
      .eq('id', id)
      .single()
      .then(({ data }) => setValid(Boolean(data && data.status === 'pending')))
  }, [id])

  if (!authLoading && !user) return <Navigate to={`/login?redirect=/join/${id}`} replace />
  if (isComplete) return <Navigate to="/" replace />

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !since) return
    setBusy(true)
    setError(null)
    const { error: err } = await joinCouple(id, since)
    setBusy(false)
    if (err) setError(joinErrorMessage(err))
    else navigate('/')
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
        {valid === false && (
          <p className="text-sm text-amber-600">Ссылка недействительна или пара уже полная.</p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Связываем…' : 'Связаться'}
        </Button>
      </form>
    </div>
  )
}
