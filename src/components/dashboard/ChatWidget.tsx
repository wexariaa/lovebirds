import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'

type Message = {
  id: string
  sender_id: string
  content: string
  created_at: string
}

export function ChatWidget() {
  const { user, profile, refreshProfile } = useAuth()
  const { coupleId } = useCouple()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    if (!coupleId) return
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: true })
    const now = Date.now()
    setMessages(
      (data ?? []).filter(
        (m) => !m.expires_at || new Date(m.expires_at).getTime() > now,
      ),
    )
  }

  useEffect(() => {
    load()
    if (!coupleId) return
    const ch = supabase
      .channel(`chat-${coupleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `couple_id=eq.${coupleId}` },
        (p) => {
          setMessages((prev) => [...prev, p.new as Message])
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [coupleId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const toggleMode = async () => {
    if (!user || !profile) return
    const next = profile.chat_mode === 'ephemeral' ? 'permanent' : 'ephemeral'
    await supabase.from('profiles').update({ chat_mode: next }).eq('id', user.id)
    await refreshProfile()
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!coupleId || !user || !text.trim()) return
    const expires_at =
      profile?.chat_mode === 'ephemeral'
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null
    await supabase.from('chat_messages').insert({
      couple_id: coupleId,
      sender_id: user.id,
      content: text.trim(),
      expires_at,
    })
    setText('')
  }

  return (
    <Card title="Чат" className="flex flex-col max-h-[420px]">
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <span className="text-xs text-rose-500">
          Режим: {profile?.chat_mode === 'ephemeral' ? 'удаление через 24ч' : 'вечное хранение'}
        </span>
        <Button variant="ghost" className="!text-xs !py-1" onClick={toggleMode}>
          Переключить режим
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] max-h-[280px] pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              m.sender_id === user?.id
                ? 'ml-auto bg-rose-500 text-white'
                : 'bg-rose-50 text-rose-900'
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 mt-3">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение…" />
        <Button type="submit">→</Button>
      </form>
    </Card>
  )
}
