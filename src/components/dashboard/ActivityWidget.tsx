import { useCallback, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { useCoupleSync } from '../../lib/realtime-sync'
import { randomItem } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'

export function ActivityWidget() {
  const { user } = useAuth()
  const { coupleId } = useCouple()
  const [ideas, setIdeas] = useState<{ id: string; text: string }[]>([])
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [custom, setCustom] = useState('')

  const load = useCallback(async () => {
    if (!coupleId) return
    const { data } = await supabase
      .from('activity_ideas')
      .select('id, text')
      .eq('couple_id', coupleId)
    setIdeas(data ?? [])
  }, [coupleId])

  useCoupleSync(coupleId, 'activity_ideas', load, [load])

  const suggest = () => {
    if (ideas.length) setSuggestion(randomItem(ideas).text)
  }

  const addCustom = async () => {
    if (!coupleId || !user || !custom.trim()) return
    await supabase.from('activity_ideas').insert({
      couple_id: coupleId,
      text: custom.trim(),
      created_by: user.id,
      is_custom: true,
    })
    setCustom('')
    load()
  }

  return (
    <Card title="Чем сегодня заняться">
      {suggestion && (
        <p className="text-lg text-rose-700 font-medium mb-3 p-3 bg-rose-50 rounded-xl">
          {suggestion}
        </p>
      )}
      <Button onClick={suggest} className="w-full mb-3">
        Предложить идею
      </Button>
      <div className="flex gap-2">
        <Input
          placeholder="Своя идея…"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <Button variant="secondary" onClick={addCustom}>
          +
        </Button>
      </div>
    </Card>
  )
}
