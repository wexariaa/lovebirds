import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const styles: Record<Variant, string> = {
  primary:
    'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200',
  secondary:
    'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  ghost: 'text-rose-600 hover:bg-rose-50',
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
