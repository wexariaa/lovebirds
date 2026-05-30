import { useCallback, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useCouple } from '../../context/CoupleContext'
import { useCoupleSync } from '../../lib/realtime-sync'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'

export function SavingsWidget() {
  const { coupleId } = useCouple()
  const [goal, setGoal] = useState({ goal_name: '', target_amount: 0, current_amount: 0 })
  const [deposit, setDeposit] = useState('')

  const load = useCallback(async () => {
    if (!coupleId) return
    let { data } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('couple_id', coupleId)
      .maybeSingle()
    if (!data) {
      const { data: created } = await supabase
        .from('savings_goals')
        .insert({ couple_id: coupleId })
        .select()
        .single()
      data = created
    }
    if (data) setGoal(data)
  }, [coupleId])

  useCoupleSync(coupleId, 'savings_goals', load, [load])

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
