import { useEffect, useRef } from 'react'
import { supabase } from './supabase'

export type CoupleSyncOptions = {
  /** 0 = только Realtime, без опроса (не дёргает страницу) */
  pollMs?: number
  events?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
}

export async function fetchPartnerUserId(
  coupleId: string,
  myUserId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('couple_members')
    .select('user_id')
    .eq('couple_id', coupleId)
  return data?.find((m) => m.user_id !== myUserId)?.user_id ?? null
}

/**
 * Realtime + опциональный редкий polling (по умолчанию выключен).
 */
export function useCoupleSync(
  coupleId: string | null | undefined,
  table: string,
  onSync: () => void | Promise<void>,
  deps: unknown[] = [],
  options: CoupleSyncOptions = {},
) {
  const onSyncRef = useRef(onSync)
  onSyncRef.current = onSync
  const pollMs = options.pollMs ?? 0
  const events = options.events ?? '*'

  useEffect(() => {
    if (!coupleId) return

    const run = () => void onSyncRef.current()
    run()

    let poll: number | undefined
    if (pollMs > 0) {
      poll = window.setInterval(run, pollMs)
    }

    const ch = supabase
      .channel(`sync-${table}-${coupleId}`)
      .on(
        'postgres_changes',
        { event: events, schema: 'public', table, filter: `couple_id=eq.${coupleId}` },
        run,
      )
      .subscribe()

    return () => {
      if (poll) window.clearInterval(poll)
      supabase.removeChannel(ch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, table, pollMs, events, ...deps])
}

/** Не пересоздавать массив, если данные те же — меньше лишних ререндеров */
export function sameById<T extends { id: string }>(prev: T[], next: T[]): boolean {
  if (prev.length !== next.length) return false
  return prev.every((p, i) => p.id === next[i]?.id)
}
