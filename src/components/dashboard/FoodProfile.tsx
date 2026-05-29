import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import type { Profile } from '../../types/database'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'

const CATEGORIES = [
  { key: 'food_vegetables' as const, label: 'Овощи' },
  { key: 'food_fruits' as const, label: 'Фрукты' },
  { key: 'food_berries' as const, label: 'Ягоды' },
  { key: 'food_dishes' as const, label: 'Блюда' },
]

export function FoodProfile() {
  const { profile, refreshProfile } = useAuth()
  const { partner } = useCouple()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})

  const sheProfile =
    profile?.gender === 'she' ? profile : partner?.gender === 'she' ? partner : null
  const heProfile =
    profile?.gender === 'he' ? profile : partner?.gender === 'he' ? partner : null

  const save = async () => {
    if (!profile) return
    const updates: Record<string, string[]> = {}
    for (const cat of CATEGORIES) {
      const raw = draft[cat.key] ?? (profile[cat.key] ?? []).join(', ')
      updates[cat.key] = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
    await supabase.from('profiles').update(updates).eq('id', profile.id)
    await refreshProfile()
    setEditing(false)
  }

  const renderColumn = (p: Profile | null, title: string) => {
    if (!p) return <div className="text-sm text-rose-400">Ожидание партнёра…</div>
    return (
      <div>
        <h3 className="font-semibold text-rose-600 mb-2">{title}</h3>
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="mb-2">
            <span className="text-xs text-rose-500">{cat.label}: </span>
            <span className="text-sm">{(p[cat.key] ?? []).join(', ') || '—'}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card title="Профиль еды">
      <div className="grid sm:grid-cols-2 gap-6">
        {renderColumn(sheProfile, 'Она любит')}
        {renderColumn(heProfile, 'Он любит')}
      </div>

      {editing ? (
        <div className="mt-4 space-y-2 border-t border-rose-100 pt-4">
          <p className="text-xs text-rose-500">Ваши продукты (через запятую)</p>
          {CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <label className="text-xs">{cat.label}</label>
              <Input
                value={draft[cat.key] ?? (profile?.[cat.key] ?? []).join(', ')}
                onChange={(e) => setDraft({ ...draft, [cat.key]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={save}>Сохранить</Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" className="mt-4" onClick={() => setEditing(true)}>
          Редактировать мой профиль
        </Button>
      )}
    </Card>
  )
}
