import { useEffect, useRef } from 'react'
import { supabase } from './supabase'

/** Интервал опроса, если Realtime в Supabase не включён */
export const COUPLE_POLL_MS = 3000

/**
 * Загрузка данных пары + Realtime + polling (работает даже без publication).
 */
export function useCoupleSync(
  coupleId: string | null | undefined,
  table: string,
  onSync: () => void | Promise<void>,
  deps: unknown[] = [],
) {
  const onSyncRef = useRef(onSync)
  onSyncRef.current = onSync

  useEffect(() => {
    if (!coupleId) return

    const run = () => void onSyncRef.current()
    run()

    const poll = window.setInterval(run, COUPLE_POLL_MS)
    const ch = supabase
      .channel(`sync-${table}-${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `couple_id=eq.${coupleId}` },
        run,
      )
      .subscribe()

    return () => {
      window.clearInterval(poll)
      supabase.removeChannel(ch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, table, ...deps])
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
