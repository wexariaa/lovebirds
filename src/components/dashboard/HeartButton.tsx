import { useCallback, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { useCoupleSync } from '../../lib/realtime-sync'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

function triggerPulse(
  setActive: (v: boolean) => void,
  setToast: (v: boolean) => void,
) {
  setActive(true)
  setToast(true)
  window.setTimeout(() => setActive(false), 5000)
  window.setTimeout(() => setToast(false), 5000)
}

export function HeartButton() {
  const { user } = useAuth()
  const { coupleId } = useCouple()
  const [active, setActive] = useState(false)
  const [toast, setToast] = useState(false)
  const lastSeenIdRef = useRef<string | null>(null)

  const checkPulses = useCallback(async () => {
    if (!coupleId || !user) return
    const { data, error } = await supabase
      .from('heart_pulses')
      .select('id, sender_id, created_at')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error || !data) return
    if (data.id === lastSeenIdRef.current) return
    lastSeenIdRef.current = data.id
    if (data.sender_id !== user.id) {
      triggerPulse(setActive, setToast)
    }
  }, [coupleId, user])

  useCoupleSync(coupleId, 'heart_pulses', checkPulses, [checkPulses])

  const send = async () => {
    if (!coupleId || !user) return
    const { data, error } = await supabase
      .from('heart_pulses')
      .insert({ couple_id: coupleId, sender_id: user.id })
      .select('id')
      .single()
    if (error) console.error('heart send:', error.message)
    else if (data) lastSeenIdRef.current = data.id
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
