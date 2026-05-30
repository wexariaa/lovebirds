import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const styles: Record<Variant, string> = {
  primary:
    'bg-[var(--lb-accent)] hover:bg-[var(--lb-accent-hover)] text-white shadow-md shadow-[var(--lb-accent)]/20',
  secondary:
    'bg-[var(--lb-surface)] border border-[var(--lb-border)] text-[var(--lb-text)] hover:bg-[var(--lb-accent-soft)]',
  danger: 'bg-red-700 hover:bg-red-600 text-white',
  ghost: 'text-[var(--lb-muted)] hover:text-[var(--lb-accent)] hover:bg-[var(--lb-accent-soft)]',
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
