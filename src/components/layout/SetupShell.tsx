import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function SetupShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lb-page flex flex-col">
      <header className="py-6 text-center border-b border-[var(--lb-border)]/60 bg-[var(--lb-surface)]/80">
        <Link to="/" className="font-display text-3xl text-[var(--lb-accent)]">
          Lovebirds
        </Link>
      </header>
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
