import { useCallback, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCouple } from '../../context/CoupleContext'
import { fetchPartnerUserId, useCoupleSync } from '../../lib/realtime-sync'
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
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!coupleId || !user) return
    setLoadError(null)

    let { data, error } = await supabase
      .from('tic_tac_toe_games')
      .select('*')
      .eq('couple_id', coupleId)
      .maybeSingle()

    if (error) {
      console.error('ttt load:', error.message)
      setLoadError(error.message)
      return
    }

    const partnerId = partner?.id ?? (await fetchPartnerUserId(coupleId, user.id))

    if (!data) {
      const { data: created, error: insErr } = await supabase
        .from('tic_tac_toe_games')
        .insert({
          couple_id: coupleId,
          board: Array(9).fill(''),
          current_turn: user.id,
          player_x: user.id,
          player_o: partnerId,
          status: 'playing',
        })
        .select()
        .single()
      if (insErr) {
        setLoadError(insErr.message)
        return
      }
      data = created
    } else if (!data.player_o && partnerId) {
      const { data: updated, error: upErr } = await supabase
        .from('tic_tac_toe_games')
        .update({ player_o: partnerId })
        .eq('couple_id', coupleId)
        .select()
        .single()
      if (!upErr && updated) data = updated
      else data = { ...data, player_o: partnerId }
    }

    if (data) {
      const board = Array.isArray(data.board) ? data.board : Array(9).fill('')
      setGame({ ...(data as Game), board })
    }
  }, [coupleId, user, partner?.id])

  useCoupleSync(coupleId, 'tic_tac_toe_games', load, [load])

  if (!user) return <Card title="Крестики-нолики">Войдите в аккаунт</Card>
  if (!coupleId) return <Card title="Крестики-нолики">Нет пары</Card>
  if (loadError) {
    return (
      <Card title="Крестики-нолики">
        <p className="text-sm text-red-600">Ошибка: {loadError}</p>
        <Button variant="secondary" className="mt-2" onClick={() => void load()}>
          Повторить
        </Button>
      </Card>
    )
  }
  if (!game) return <Card title="Крестики-нолики">Загрузка…</Card>

  const mySymbol =
    game.player_x === user.id ? 'X' : game.player_o === user.id ? 'O' : null
  const isMyTurn = game.current_turn === user.id && game.status === 'playing'
  const waitingPartner = !game.player_o || !game.player_x

  const play = async (idx: number) => {
    if (!coupleId || !mySymbol || !isMyTurn || game.board[idx]) return
    const board = [...game.board]
    board[idx] = mySymbol
    const { winner, draw } = checkTttWinner(board)
    const partnerId = game.player_x === user.id ? game.player_o : game.player_x
    const nextTurn = partnerId ?? user.id
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
    const { error } = await supabase
      .from('tic_tac_toe_games')
      .update(updates)
      .eq('couple_id', coupleId)
    if (error) console.error('ttt play:', error.message)
    else setGame((g) => (g ? { ...g, ...updates, board } as Game : g))
  }

  const reset = async () => {
    if (!coupleId) return
    const { error } = await supabase
      .from('tic_tac_toe_games')
      .update({
        board: Array(9).fill(''),
        status: 'playing',
        winner_id: null,
        current_turn: game.player_x,
      })
      .eq('couple_id', coupleId)
    if (error) console.error('ttt reset:', error.message)
    else void load()
  }

  let statusText = 'Игра идёт'
  if (waitingPartner) statusText = 'Ждём партнёра в паре…'
  else if (game.status === 'won') {
    statusText = game.winner_id === user.id ? 'Вы победили! 🎉' : 'Партнёр победил'
  } else if (game.status === 'draw') statusText = 'Ничья'

  return (
    <Card title="Крестики-нолики">
      <p className="text-sm text-rose-600 mb-3">
        {waitingPartner
          ? statusText
          : game.status === 'playing'
            ? isMyTurn
              ? 'Ваш ход'
              : 'Ход партнёра'
            : statusText}
      </p>
      {!mySymbol && !waitingPartner && (
        <p className="text-xs text-amber-600 mb-2">Обновите страницу, если не видите свои X/O</p>
      )}
      <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
        {game.board.map((cell, i) => (
          <button
            key={i}
            type="button"
            disabled={
              waitingPartner ||
              !mySymbol ||
              !isMyTurn ||
              Boolean(cell) ||
              game.status !== 'playing'
            }
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
