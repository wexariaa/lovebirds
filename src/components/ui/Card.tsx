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
      className={`rounded-2xl bg-white/80 backdrop-blur border border-rose-100 shadow-sm p-4 sm:p-5 ${className}`}
    >
      {title && <h2 className="text-lg font-semibold text-rose-700 mb-3">{title}</h2>}
      {children}
    </section>
  )
}
