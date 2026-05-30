import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { useCoupleSync } from '../../lib/realtime-sync'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'

export function MeetingCountdown() {
  const { user } = useAuth()
  const { coupleId } = useCouple()
  const [meetingAt, setMeetingAt] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [left, setLeft] = useState('')

  const load = useCallback(async () => {
    if (!coupleId) return
    const { data } = await supabase
      .from('couple_meetings')
      .select('meeting_at')
      .eq('couple_id', coupleId)
      .maybeSingle()
    setMeetingAt(data?.meeting_at ?? null)
  }, [coupleId])

  useCoupleSync(coupleId, 'couple_meetings', load, [load])

  useEffect(() => {
    if (!meetingAt) {
      setLeft('')
      return
    }
    const tick = () => {
      const diff = new Date(meetingAt).getTime() - Date.now()
      if (diff <= 0) {
        setLeft('Пора встречаться! 💕')
        return
      }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setLeft(`${d}д ${h}ч ${m}м ${s}с`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [meetingAt])

  const save = async () => {
    if (!coupleId || !user || !draft) return
    await supabase.from('couple_meetings').upsert({
      couple_id: coupleId,
      meeting_at: new Date(draft).toISOString(),
      set_by: user.id,
    })
    setMeetingAt(new Date(draft).toISOString())
  }

  return (
    <Card title="До следующей встречи">
      {meetingAt ? (
        <p className="text-xl font-mono text-rose-600">{left}</p>
      ) : (
        <p className="text-sm text-rose-500 mb-2">Дата встречи ещё не назначена</p>
      )}
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <Input
          type="datetime-local"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button variant="secondary" onClick={save}>
          Установить
        </Button>
      </div>
    </Card>
  )
}
