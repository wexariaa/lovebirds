import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { readCachedSession } from '../lib/auth-cache'
import { friendlyNetworkError, isRetryableError, sleep } from '../lib/network'
import type { Profile } from '../types/database'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

// Supabase: не вызывать API внутри onAuthStateChange синхронно — иначе зависание
function defer(fn: () => void) {
  queueMicrotask(fn)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readCachedSession())
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const profileLoadRef = useRef(0)
  const bootProfileRef = useRef(false)

  const loadProfile = useCallback(async (userId: string, userMeta?: User) => {
    const loadId = ++profileLoadRef.current
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (loadId !== profileLoadRef.current) return

    if (data) {
      setProfile(data)
      return
    }

    if (error) console.error('profile load:', error.message)

    const displayName =
      userMeta?.user_metadata?.display_name ??
      userMeta?.email?.split('@')[0] ??
      'Пользователь'

    const { data: created } = await supabase
      .from('profiles')
      .upsert({ id: userId, display_name: displayName })
      .select()
      .single()

    if (loadId === profileLoadRef.current) setProfile(created)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id, session.user)
  }, [session?.user, loadProfile])

  useEffect(() => {
    let mounted = true

    const cached = readCachedSession()
    if (cached?.user && !bootProfileRef.current) {
      bootProfileRef.current = true
      defer(() => loadProfile(cached.user.id, cached.user))
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return
      setSession(s)
      setLoading(false)
      if (s?.user) {
        defer(() => loadProfile(s.user.id, s.user))
      } else if (event === 'SIGNED_OUT') {
        profileLoadRef.current++
        setProfile(null)
        bootProfileRef.current = false
      }
    })

    // Фон: обновить токен / подтвердить сессию — UI уже показан из кэша
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session?.user) {
        defer(() => loadProfile(data.session!.user.id, data.session!.user))
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (!error) return { error: null }
        const msg = error.message
        if (!isRetryableError(msg) || attempt === 2) {
          return { error: friendlyNetworkError(msg) }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (attempt === 2) return { error: friendlyNetworkError(msg) }
      }
      await sleep(800 * (attempt + 1))
    }
    return { error: 'Не удалось войти. Проверьте интернет и попробуйте снова.' }
  }, [])

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        })
        if (!error) {
          if (data.session) return { error: null }
          return {
            error:
              'Аккаунт создан. Войдите с тем же email и паролем (или подтвердите email в Supabase).',
          }
        }
        const msg = error.message
        if (!isRetryableError(msg) || attempt === 2) {
          return { error: friendlyNetworkError(msg) }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (attempt === 2) return { error: friendlyNetworkError(msg) }
      }
      await sleep(800 * (attempt + 1))
    }
    return { error: 'Не удалось зарегистрироваться. Проверьте интернет.' }
  }, [])

  const signOut = useCallback(async () => {
    profileLoadRef.current++
    bootProfileRef.current = false
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, signIn, signUp, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
