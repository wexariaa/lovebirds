import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { checkTttWinner } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

type Game = {
  board: string[]
  current_turn: string | null
  player_x: string | null
  player_o: string | null
  status: string
  winner_id: string | null
}

export function TicTacToe() {
  const { user } = useAuth()
  const { coupleId, partner } = useCouple()
  const [game, setGame] = useState<Game | null>(null)

  const load = async () => {
    if (!coupleId) return
    const { data } = await supabase
      .from('tic_tac_toe_games')
      .select('*')
      .eq('couple_id', coupleId)
      .single()
    if (data) {
      let g = data as Game
      if (data.player_o === null && partner) {
        await supabase
          .from('tic_tac_toe_games')
          .update({ player_o: partner.id })
          .eq('couple_id', coupleId)
        g = { ...g, player_o: partner.id }
      }
      setGame(g)
    }
  }

  useEffect(() => {
    load()
    if (!coupleId) return
    const ch = supabase
      .channel(`ttt-${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tic_tac_toe_games', filter: `couple_id=eq.${coupleId}` },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [coupleId, partner])

  if (!game || !user) return <Card title="Крестики-нолики">Загрузка…</Card>

  const mySymbol =
    game.player_x === user.id ? 'X' : game.player_o === user.id ? 'O' : null
  const isMyTurn = game.current_turn === user.id && game.status === 'playing'

  const play = async (idx: number) => {
    if (!coupleId || !mySymbol || !isMyTurn || game.board[idx]) return
    const board = [...game.board]
    board[idx] = mySymbol
    const { winner, draw } = checkTttWinner(board)
    const nextTurn = partner?.id ?? user.id
    const updates: Record<string, unknown> = {
      board,
      current_turn: winner || draw ? null : nextTurn,
      updated_at: new Date().toISOString(),
    }
    if (winner) {
      updates.status = 'won'
      updates.winner_id = user.id
    } else if (draw) {
      updates.status = 'draw'
    }
    await supabase.from('tic_tac_toe_games').update(updates).eq('couple_id', coupleId)
  }

  const reset = async () => {
    if (!coupleId) return
    await supabase
      .from('tic_tac_toe_games')
      .update({
        board: Array(9).fill(''),
        status: 'playing',
        winner_id: null,
        current_turn: game.player_x,
      })
      .eq('couple_id', coupleId)
  }

  let statusText = 'Игра идёт'
  if (game.status === 'won') {
    statusText =
      game.winner_id === user.id ? 'Вы победили! 🎉' : 'Партнёр победил'
  } else if (game.status === 'draw') statusText = 'Ничья'

  return (
    <Card title="Крестики-нолики">
      <p className="text-sm text-rose-600 mb-3">
        {game.status === 'playing'
          ? isMyTurn
            ? 'Ваш ход'
            : 'Ход партнёра'
          : statusText}
      </p>
      <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
        {game.board.map((cell, i) => (
          <button
            key={i}
            type="button"
            disabled={!isMyTurn || Boolean(cell) || game.status !== 'playing'}
            onClick={() => play(i)}
            className="aspect-square rounded-xl bg-rose-50 text-2xl font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
          >
            {cell}
          </button>
        ))}
      </div>
      {(game.status === 'won' || game.status === 'draw') && (
        <Button variant="secondary" className="mt-4 w-full" onClick={reset}>
          Новая игра
        </Button>
      )}
    </Card>
  )
}
