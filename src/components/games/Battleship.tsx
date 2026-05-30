import { useCallback, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { fetchPartnerUserId, useCoupleSync } from '../../lib/realtime-sync'
import {
  BS_SIZE,
  type BsState,
  applyShot,
  createInitialState,
  resetGame,
} from '../../lib/battleship'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

function Grid({
  title,
  cells,
  onCellClick,
  interactive,
}: {
  title: string
  cells: { className: string; label: string }[]
  onCellClick?: (i: number) => void
  interactive?: boolean
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--lb-muted)] mb-2 text-center">{title}</p>
      <div
        className="grid gap-1 mx-auto"
        style={{ gridTemplateColumns: `repeat(${BS_SIZE}, minmax(0, 1fr))`, maxWidth: 280 }}
      >
        {cells.map((cell, i) => (
          <button
            key={i}
            type="button"
            disabled={!interactive || !onCellClick}
            onClick={() => onCellClick?.(i)}
            className={`aspect-square rounded-md text-[10px] font-semibold transition ${cell.className}`}
            title={cell.label}
          >
            {cell.label.length <= 2 ? cell.label : ''}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Battleship() {
  const { user } = useAuth()
  const { coupleId, partner } = useCouple()
  const [state, setState] = useState<BsState | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!coupleId || !user) return
    setErr(null)
    const { data, error } = await supabase
      .from('battleship_games')
      .select('state')
      .eq('couple_id', coupleId)
      .maybeSingle()

    if (error) {
      setErr(error.message)
      return
    }

    const partnerId = partner?.id ?? (await fetchPartnerUserId(coupleId, user.id))
    if (!partnerId) {
      setState(null)
      return
    }

    if (!data?.state || Object.keys((data.state as BsState).players ?? {}).length < 2) {
      const initial = createInitialState([user.id, partnerId], user.id)
      const { error: insErr } = await supabase
        .from('battleship_games')
        .upsert({ couple_id: coupleId, state: initial })
      if (insErr) setErr(insErr.message)
      else setState(initial)
      return
    }

    setState(data.state as BsState)
  }, [coupleId, user, partner?.id])

  useCoupleSync(coupleId, 'battleship_games', load, [load])

  const save = async (next: BsState) => {
    if (!coupleId) return
    setState(next)
    await supabase
      .from('battleship_games')
      .upsert({ couple_id: coupleId, state: next, updated_at: new Date().toISOString() })
  }

  if (!user || !coupleId) return <Card title="Морской бой">Нет пары</Card>
  if (err) {
    return (
      <Card title="Морской бой">
        <p className="text-sm text-red-500">{err}</p>
        <p className="text-xs text-[var(--lb-muted)] mt-2">
          Выполните fix-battleship.sql в Supabase, если таблицы ещё нет.
        </p>
      </Card>
    )
  }
  if (!state || !partner) {
    return <Card title="Морской бой">Загрузка… (нужен партнёр в паре)</Card>
  }

  const me = state.players[user.id]
  const them = state.players[partner.id]
  if (!me || !them) return <Card title="Морской бой">Ожидаем партнёра…</Card>

  const myTurn = state.turn === user.id && state.phase === 'play'
  const enemyCells = Array.from({ length: BS_SIZE * BS_SIZE }, (_, i) => {
    if (me.shots.includes(i)) {
      const hit = them.ships.includes(i)
      return {
        className: hit ? 'bg-[var(--lb-hit)] text-white' : 'bg-[var(--lb-miss)] text-white',
        label: hit ? '✕' : '·',
      }
    }
    return {
      className: myTurn
        ? 'bg-[var(--lb-sea)] hover:bg-[var(--lb-sea-hover)] cursor-pointer'
        : 'bg-[var(--lb-sea)]',
      label: '',
    }
  })

  const myCells = Array.from({ length: BS_SIZE * BS_SIZE }, (_, i) => {
    const ship = me.ships.includes(i)
    const hit = me.received.includes(i)
    let className = 'bg-[var(--lb-sea)]'
    let label = ''
    if (ship && !hit) {
      className = 'bg-[var(--lb-ship)]'
      label = '■'
    }
    if (hit) {
      className = 'bg-[var(--lb-hit)]'
      label = '✕'
    }
    return { className, label }
  })

  const shoot = async (cell: number) => {
    const next = applyShot(state, user.id, partner.id, cell)
    if (next) await save(next)
  }

  const newRound = async () => {
    const next = resetGame([user.id, partner.id], user.id)
    await save(next)
  }

  let status = myTurn ? 'Ваш ход — стреляйте по полю партнёра' : 'Ход партнёра…'
  if (state.phase === 'end' && state.winner) {
    status = state.winner === user.id ? 'Победа! 🎉' : 'Партнёр победил'
  }

  return (
    <Card title="Морской бой" className="space-y-4">
      <p className="text-sm text-center text-[var(--lb-muted)]">{status}</p>
      <div className="grid sm:grid-cols-2 gap-6">
        <Grid title="Поле партнёра" cells={enemyCells} onCellClick={shoot} interactive={myTurn} />
        <Grid title="Ваше поле" cells={myCells} />
      </div>
      {state.phase === 'end' && (
        <Button variant="secondary" className="w-full" onClick={newRound}>
          Новая игра
        </Button>
      )}
    </Card>
  )
}
