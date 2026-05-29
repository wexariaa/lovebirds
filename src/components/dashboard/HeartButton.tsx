import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

export function HeartButton() {
  const { user } = useAuth()
  const { coupleId } = useCouple()
  const [active, setActive] = useState(false)
  const [toast, setToast] = useState(false)

  useEffect(() => {
    if (!coupleId || !user) return

    const ch = supabase
      .channel(`hearts-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'heart_pulses',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          const row = payload.new as { sender_id: string }
          if (row.sender_id !== user.id) {
            setActive(true)
            setToast(true)
            setTimeout(() => setActive(false), 5000)
            setTimeout(() => setToast(false), 5000)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [coupleId, user])

  const send = async () => {
    if (!coupleId || !user) return
    await supabase.from('heart_pulses').insert({
      couple_id: coupleId,
      sender_id: user.id,
    })
  }

  return (
    <>
      <Card className="text-center relative overflow-hidden">
        <button
          type="button"
          onClick={send}
          className={`text-6xl sm:text-7xl transition ${active ? 'heart-active' : 'hover:scale-110'}`}
          aria-label="Отправить сердечко"
        >
          ❤️
        </button>
        <p className="text-sm text-rose-600 mt-2">Нажми — партнёр почувствует</p>
        <Button variant="secondary" className="mt-3 w-full sm:w-auto" onClick={send}>
          Отправить пульс
        </Button>
      </Card>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 toast-enter bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium max-w-[90vw] text-center">
          Твой партнёр думает о тебе ❤️
        </div>
      )}
    </>
  )
}
