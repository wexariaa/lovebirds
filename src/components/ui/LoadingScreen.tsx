export function LoadingScreen({ hint }: { hint?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 lb-page">
      <div className="w-9 h-9 border-2 border-[var(--lb-border)] border-t-[var(--lb-gold)] rounded-full animate-spin" />
      <p className="text-[var(--lb-muted)]">Загрузка…</p>
      {hint && <p className="text-xs text-[var(--lb-muted)]/80 max-w-xs text-center">{hint}</p>}
    </div>
  )
}
