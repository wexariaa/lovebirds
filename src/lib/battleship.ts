export const BS_SIZE = 8
const SHIP_LENGTHS = [4, 3, 3, 2, 2]

export type BsPlayer = {
  ships: number[]
  shots: number[]
  received: number[]
}

export type BsState = {
  phase: 'place' | 'play' | 'end'
  turn: string | null
  winner: string | null
  players: Record<string, BsPlayer>
}

export function placeShipsRandom(): number[] {
  const occupied = new Set<number>()
  const all: number[] = []

  for (const len of SHIP_LENGTHS) {
    let placed = false
    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
      const horizontal = Math.random() < 0.5
      const row = Math.floor(Math.random() * BS_SIZE)
      const col = Math.floor(Math.random() * (BS_SIZE - (horizontal ? len : 0)))
      const cells: number[] = []
      for (let i = 0; i < len; i++) {
        const r = horizontal ? row : row + i
        const c = horizontal ? col + i : col
        cells.push(r * BS_SIZE + c)
      }
      if (cells.every((c) => !occupied.has(c))) {
        cells.forEach((c) => {
          occupied.add(c)
          all.push(c)
        })
        placed = true
      }
    }
  }
  return all
}

export function createInitialState(playerIds: string[], firstTurn: string): BsState {
  const players: Record<string, BsPlayer> = {}
  for (const id of playerIds) {
    players[id] = { ships: placeShipsRandom(), shots: [], received: [] }
  }
  return { phase: 'play', turn: firstTurn, winner: null, players }
}

export function isHit(ships: number[], cell: number): boolean {
  return ships.includes(cell)
}

export function allShipsSunk(ships: number[], received: number[]): boolean {
  return ships.length > 0 && ships.every((c) => received.includes(c))
}

export function applyShot(
  state: BsState,
  shooterId: string,
  targetId: string,
  cell: number,
): BsState | null {
  if (state.phase !== 'play' || state.turn !== shooterId || state.winner) return null
  const shooter = state.players[shooterId]
  const target = state.players[targetId]
  if (!shooter || !target) return null
  if (shooter.shots.includes(cell)) return null

  const shots = [...shooter.shots, cell]
  const received = [...target.received, cell]
  const players = {
    ...state.players,
    [shooterId]: { ...shooter, shots },
    [targetId]: { ...target, received },
  }

  let winner: string | null = null
  let phase: BsState['phase'] = 'play'
  let turn: string | null = targetId

  if (allShipsSunk(target.ships, received)) {
    winner = shooterId
    phase = 'end'
    turn = null
  }

  return { ...state, players, winner, phase, turn }
}

export function resetGame(playerIds: string[], firstTurn: string): BsState {
  return createInitialState(playerIds, firstTurn)
}
