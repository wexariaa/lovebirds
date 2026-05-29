import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useCouple } from '../../context/CoupleContext'
import { getNextImportantDate } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'

type DateRow = { id: string; title: string; event_date: string }

export function ImportantDates() {
  const { coupleId } = useCouple()
  const [dates, setDates] = useState<DateRow[]>([])
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')

  const load = async () => {
    if (!coupleId) return
    const { data } = await supabase
      .from('important_dates')
      .select('*')
      .eq('couple_id', coupleId)
      .order('event_date')
    setDates(data ?? [])
  }

  useEffect(() => {
    load()
  }, [coupleId])

  const next = getNextImportantDate(dates)

  const add = async () => {
    if (!coupleId || !title || !eventDate) return
    await supabase.from('important_dates').insert({
      couple_id: coupleId,
      title,
      event_date: eventDate,
    })
    setTitle('')
    setEventDate('')
    load()
  }

  const remove = async (id: string) => {
    await supabase.from('important_dates').delete().eq('id', id)
    load()
  }

  return (
    <Card title="Важные даты">
      {next && (
        <div className="mb-4 p-3 bg-rose-50 rounded-xl">
          <p className="text-xs text-rose-500">Ближайшая</p>
          <p className="font-semibold text-rose-700">{next.title}</p>
          <p className="text-sm">
            через {next.daysUntil} дн. ({new Date(next.event_date).toLocaleDateString('ru-RU')})
          </p>
        </div>
      )}
      <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto">
        {dates.map((d) => (
          <li key={d.id} className="flex justify-between items-center text-sm gap-2">
            <span>
              {d.title} — {new Date(d.event_date).toLocaleDateString('ru-RU')}
            </span>
            <button type="button" className="text-red-400 text-xs" onClick={() => remove(d.id)}>
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="space-y-2">
        <Input placeholder="Название" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        <Button variant="secondary" className="w-full" onClick={add}>
          Добавить
        </Button>
      </div>
    </Card>
  )
}
