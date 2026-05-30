import { useCallback, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { MOOD_EMOJIS } from '../../lib/constants'
import { useCoupleSync } from '../../lib/realtime-sync'
import { Card } from '../ui/Card'

export function MoodWidget() {
  const { user } = useAuth()
  const { coupleId, partner } = useCouple()
  const [mine, setMine] = useState<string | null>(null)
  const [theirs, setTheirs] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const load = useCallback(async () => {
    if (!coupleId) return
    const { data } = await supabase
      .from('daily_moods')
      .select('user_id, emoji')
      .eq('couple_id', coupleId)
      .eq('mood_date', today)
    setMine(data?.find((m) => m.user_id === user?.id)?.emoji ?? null)
    setTheirs(data?.find((m) => m.user_id === partner?.id)?.emoji ?? null)
  }, [coupleId, partner?.id, user?.id, today])

  useCoupleSync(coupleId, 'daily_moods', load, [load])

  const pick = async (emoji: string) => {
    if (!coupleId || !user) return
    await supabase.from('daily_moods').upsert(
      { couple_id: coupleId, user_id: user.id, emoji, mood_date: today },
      { onConflict: 'couple_id,user_id,mood_date' },
    )
    setMine(emoji)
  }

  return (
    <Card title="Настроение дня">
      <p className="text-xs text-rose-500 mb-2">Ваше настроение</p>
      <div className="flex gap-2 flex-wrap mb-4">
        {MOOD_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => pick(e)}
            className={`text-2xl p-2 rounded-xl transition ${mine === e ? 'bg-rose-200 ring-2 ring-rose-400' : 'hover:bg-rose-50'}`}
          >
            {e}
          </button>
        ))}
      </div>
      <p className="text-xs text-rose-500">Партнёр</p>
      <p className="text-3xl">{theirs ?? '—'}</p>
    </Card>
  )
}
