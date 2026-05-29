import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { DEFAULT_COMPLIMENTS } from '../../lib/constants'
import { randomItem } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

type Compliment = { id: string; text: string; created_at: string }

export function ComplimentsWidget() {
  const { user } = useAuth()
  const { coupleId } = useCouple()
  const [feed, setFeed] = useState<Compliment[]>([])

  const load = async () => {
    if (!coupleId) return
    const { data } = await supabase
      .from('compliments')
      .select('id, text, created_at')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })
      .limit(5)
    setFeed(data ?? [])
  }

  useEffect(() => {
    load()
    if (!coupleId) return
    const ch = supabase
      .channel(`compliments-${coupleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'compliments', filter: `couple_id=eq.${coupleId}` },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [coupleId])

  const send = async () => {
    if (!coupleId || !user) return
    const text = randomItem(DEFAULT_COMPLIMENTS)
    await supabase.from('compliments').insert({
      couple_id: coupleId,
      sender_id: user.id,
      text,
    })
    load()
  }

  return (
    <Card title="Комплименты">
      <Button onClick={send} className="w-full mb-4">
        Сказать комплимент
      </Button>
      <ul className="space-y-2">
        {feed.map((c) => (
          <li key={c.id} className="text-sm p-2 bg-rose-50 rounded-lg text-rose-800">
            {c.text}
          </li>
        ))}
      </ul>
    </Card>
  )
}
