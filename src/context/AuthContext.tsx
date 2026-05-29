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
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const profileLoadRef = useRef(0)

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

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return
        setSession(data.session)
        setLoading(false)
        if (data.session?.user) {
          defer(() => loadProfile(data.session!.user.id, data.session!.user))
        }
      })
      .catch((e) => {
        console.error('auth session:', e)
        if (mounted) setLoading(false)
      })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return
      setSession(s)
      setLoading(false)
      if (s?.user) {
        defer(() => loadProfile(s.user.id, s.user))
      } else {
        profileLoadRef.current++
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    profileLoadRef.current++
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
