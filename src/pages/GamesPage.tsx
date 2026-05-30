import { Battleship } from '../components/games/Battleship'

export function GamesPage() {
  return (
    <>
      <div className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--lb-gold)] mb-2">вместе веселее</p>
        <h1 className="font-display text-3xl text-[var(--lb-text)]">Игры</h1>
      </div>
      <div className="max-w-xl mx-auto">
        <Battleship />
      </div>
    </>
  )
}
