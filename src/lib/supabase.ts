import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30000)
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

export const supabase = createClient(url ?? '', key ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: fetchWithTimeout,
  },
})

export const isSupabaseConfigured = Boolean(url && key)
