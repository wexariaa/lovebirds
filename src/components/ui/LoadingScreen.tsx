export function LoadingScreen({ hint }: { hint?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-rose-500 gap-2">
      <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
      <p>Загрузка…</p>
      {hint && <p className="text-xs text-rose-400 max-w-xs text-center">{hint}</p>}
    </div>
  )
}
