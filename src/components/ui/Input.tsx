import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-[var(--lb-border)] bg-[var(--lb-bg)] text-[var(--lb-text)] placeholder:text-[var(--lb-muted)]/60 px-3 py-2.5 text-sm outline-none focus:border-[var(--lb-gold)] focus:ring-2 focus:ring-[var(--lb-gold)]/20 ${className}`}
      {...props}
    />
  )
}

export function Textarea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-xl border border-[var(--lb-border)] bg-[var(--lb-bg)] text-[var(--lb-text)] px-3 py-2.5 text-sm outline-none focus:border-[var(--lb-gold)] focus:ring-2 focus:ring-[var(--lb-gold)]/20 resize-none ${className}`}
      {...props}
    />
  )
}
