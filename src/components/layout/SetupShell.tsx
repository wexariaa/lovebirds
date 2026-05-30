import type { ReactNode } from 'react'

/** Экран входа / создания пары — без нижних вкладок */
export function SetupShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lb-page flex flex-col">
      <header className="py-6 text-center">
        <p className="font-display text-3xl text-[var(--lb-accent)]">Lovebirds</p>
      </header>
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pb-8">{children}</main>
    </div>
  )
}
