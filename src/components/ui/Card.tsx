import type { ReactNode } from 'react'

export function Card({
  title,
  children,
  className = '',
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-2xl bg-[var(--lb-card)]/90 backdrop-blur border border-[var(--lb-border)] shadow-lg shadow-black/10 p-4 sm:p-5 ${className}`}
    >
      {title && (
        <h2 className="font-display text-xl text-[var(--lb-gold)] mb-3">{title}</h2>
      )}
      {children}
    </section>
  )
}
