import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useCouple } from '../../context/CoupleContext'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'

export function SavingsWidget() {
  const { coupleId } = useCouple()
  const [goal, setGoal] = useState({ goal_name: '', target_amount: 0, current_amount: 0 })
  const [deposit, setDeposit] = useState('')

  const load = async () => {
    if (!coupleId) return
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('couple_id', coupleId)
      .single()
    if (data) setGoal(data)
  }

  useEffect(() => {
    load()
    if (!coupleId) return
    const ch = supabase
      .channel(`savings-${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'savings_goals', filter: `couple_id=eq.${coupleId}` },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [coupleId])

  const saveMeta = async () => {
    if (!coupleId) return
    await supabase.from('savings_goals').upsert({
      couple_id: coupleId,
      goal_name: goal.goal_name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
    })
  }

  const addDeposit = async () => {
    const amount = parseFloat(deposit)
    if (!coupleId || !amount || amount <= 0) return
    const next = Number(goal.current_amount) + amount
    await supabase
      .from('savings_goals')
      .update({ current_amount: next, updated_at: new Date().toISOString() })
      .eq('couple_id', coupleId)
    setDeposit('')
    load()
  }

  const pct =
    goal.target_amount > 0
      ? Math.min(100, (Number(goal.current_amount) / Number(goal.target_amount)) * 100)
      : 0

  return (
    <Card title="Сейф-копилка">
      <Input
        placeholder="Название цели"
        value={goal.goal_name}
        onChange={(e) => setGoal({ ...goal, goal_name: e.target.value })}
        onBlur={saveMeta}
      />
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Input
          type="number"
          placeholder="Цель"
          value={goal.target_amount || ''}
          onChange={(e) => setGoal({ ...goal, target_amount: Number(e.target.value) })}
          onBlur={saveMeta}
        />
        <Input readOnly value={`${goal.current_amount} ₽`} />
      </div>
      <div className="h-3 bg-rose-100 rounded-full mt-3 overflow-hidden">
        <div className="h-full bg-rose-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2 mt-3">
        <Input
          type="number"
          placeholder="Сумма"
          value={deposit}
          onChange={(e) => setDeposit(e.target.value)}
        />
        <Button onClick={addDeposit}>Внести</Button>
      </div>
    </Card>
  )
}
