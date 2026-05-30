import type { Session } from '@supabase/supabase-js'

/** Тот же ключ, что у Supabase: sb-<project-ref>-auth-token */
function authStorageKey(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL
  if (!url) return null
  try {
    const ref = new URL(url).hostname.split('.')[0]
    return `sb-${ref}-auth-token`
  } catch {
    return null
  }
}

/** Синхронно из localStorage — без сети, для мгновенного UI */
export function readCachedSession(): Session | null {
  if (typeof window === 'undefined') return null
  const key = authStorageKey()
  if (!key) return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    if (!session?.access_token || !session?.user) return null
    return session
  } catch {
    return null
  }
}
