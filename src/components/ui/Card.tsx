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
    <section className={`lb-card-peach p-4 sm:p-5 ${className}`}>
      {title && (
        <h2 className="font-display text-xl text-[var(--lb-accent)] mb-3">{title}</h2>
      )}
      {children}
    </section>
  )
}
