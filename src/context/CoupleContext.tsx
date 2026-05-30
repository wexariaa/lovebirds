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
import { supabase } from '../lib/supabase'
import { friendlyNetworkError, isRetryableError, sleep, withTimeout } from '../lib/network'
import { useAuth } from './AuthContext'
import type { Couple, Profile } from '../types/database'

const COUPLE_FETCH_MS = 8000

interface CoupleState {
  couple: Couple | null
  coupleId: string | null
  myRole: 'a' | 'b' | null
  partner: Profile | null
  memberCount: number
  loading: boolean
  resolved: boolean
  isComplete: boolean
  refresh: () => Promise<void>
  createCouple: () => Promise<{ coupleId: string | null; error: string | null }>
  joinCouple: (coupleId: string, togetherSince: string) => Promise<{ error: string | null }>
  setTogetherSince: (date: string) => Promise<{ error: string | null }>
  dissolve: () => Promise<{ error: string | null }>
}

const CoupleContext = createContext<CoupleState | null>(null)

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [couple, setCouple] = useState<Couple | null>(null)
  const [myRole, setMyRole] = useState<'a' | 'b' | null>(null)
  const [partner, setPartner] = useState<Profile | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [resolved, setResolved] = useState(false)
  const userId = user?.id
  const refreshGen = useRef(0)

  const loadPartner = useCallback(async (partnerId: string, gen: number) => {
    try {
      const { data } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', partnerId).single(),
        COUPLE_FETCH_MS,
        'partner_profile',
      )
      if (gen === refreshGen.current) setPartner(data)
    } catch (e) {
      console.error('partner profile:', e)
    }
  }, [])

  const refresh = useCallback(
    async (opts?: { silent?: boolean }) => {
      const gen = ++refreshGen.current

      if (!userId) {
        setCouple(null)
        setMyRole(null)
        setPartner(null)
        setMemberCount(0)
        setLoading(false)
        setResolved(true)
        return
      }

      if (!opts?.silent) setLoading(true)

      try {
        const { data: membership, error: mErr } = await withTimeout(
          supabase
            .from('couple_members')
            .select('couple_id, role')
            .eq('user_id', userId)
            .maybeSingle(),
          COUPLE_FETCH_MS,
          'couple_members',
        )

        if (gen !== refreshGen.current) return
        if (mErr) console.error('couple_members:', mErr.message)

        if (!membership) {
          setCouple(null)
          setMyRole(null)
          setPartner(null)
          setMemberCount(0)
          return
        }

        setMyRole(membership.role)

        const [{ data: coupleData }, { data: members }] = await withTimeout(
          Promise.all([
            supabase.from('couples').select('*').eq('id', membership.couple_id).single(),
            supabase
              .from('couple_members')
              .select('user_id')
              .eq('couple_id', membership.couple_id),
          ]),
          COUPLE_FETCH_MS,
          'couple_bundle',
        )

        if (gen !== refreshGen.current) return

        setCouple(coupleData)
        const count = members?.length ?? 0
        setMemberCount(count)

        const partnerId = members?.find((m) => m.user_id !== userId)?.user_id
        if (partnerId) {
          void loadPartner(partnerId, gen)
        } else {
          setPartner(null)
        }
      } catch (e) {
        console.error('couple refresh:', e)
      } finally {
        if (gen === refreshGen.current) {
          if (!opts?.silent) setLoading(false)
          setResolved(true)
        }
      }
    },
    [userId, loadPartner],
  )

  useEffect(() => {
    setResolved(false)
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!couple?.id) return

    let channel: ReturnType<typeof supabase.channel> | null = null
    const timer = setTimeout(() => {
      channel = supabase
        .channel(`couple-${couple.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${couple.id}` },
          () => refresh({ silent: true }),
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'couple_members',
            filter: `couple_id=eq.${couple.id}`,
          },
          () => refresh({ silent: true }),
        )
        .subscribe()
    }, 1500)

    return () => {
      clearTimeout(timer)
      if (channel) supabase.removeChannel(channel)
    }
  }, [couple?.id, refresh])

  const createCouple = useCallback(async () => {
    if (!userId) return { coupleId: null, error: 'Не авторизован' }

    const { data: existing } = await supabase
      .from('couple_members')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    if (existing) return { coupleId: null, error: 'Вы уже в паре' }

    const coupleId = crypto.randomUUID()

    const { error: cErr } = await supabase
      .from('couples')
      .insert({ id: coupleId, status: 'pending' })
    if (cErr) return { coupleId: null, error: cErr.message }

    const { error: mErr } = await supabase.from('couple_members').insert({
      couple_id: coupleId,
      user_id: userId,
      role: 'a',
    })
    if (mErr) return { coupleId: null, error: mErr.message }

    await refresh({ silent: true })
    return { coupleId, error: null }
  }, [userId, refresh])

  const joinCouple = useCallback(
    async (coupleId: string, togetherSince: string) => {
      if (!userId) return { error: 'Не авторизован' }

      let lastError: string | null = null

      for (let attempt = 0; attempt < 3; attempt++) {
        const { error: rpcErr } = await supabase.rpc('join_couple', {
          p_couple_id: coupleId,
          p_together_since: togetherSince,
        })

        if (!rpcErr) {
          lastError = null
          break
        }

        const msg = rpcErr.message
        lastError = friendlyNetworkError(msg)

        const rpcMissing =
          msg.toLowerCase().includes('pgrst202') ||
          msg.toLowerCase().includes('could not find the function')

        if (rpcMissing) {
          const { error: mErr } = await supabase.from('couple_members').insert({
            couple_id: coupleId,
            user_id: userId,
            role: 'b',
          })
          if (mErr) {
            lastError = friendlyNetworkError(mErr.message)
            break
          }
          const { error: uErr } = await supabase
            .from('couples')
            .update({ status: 'active', together_since: togetherSince })
            .eq('id', coupleId)
          if (uErr) {
            lastError = friendlyNetworkError(uErr.message)
            break
          }
          lastError = null
          break
        }

        if (!isRetryableError(msg) || attempt === 2) break
        await sleep(800 * (attempt + 1))
      }

      if (lastError) {
        const { data: membership } = await supabase
          .from('couple_members')
          .select('role')
          .eq('couple_id', coupleId)
          .eq('user_id', userId)
          .maybeSingle()
        if (membership?.role === 'b') {
          lastError = null
        }
      }

      if (lastError) return { error: lastError }

      void seedCoupleData(coupleId, userId)
      void refresh({ silent: true })
      return { error: null }
    },
    [userId, refresh],
  )

  const setTogetherSince = useCallback(
    async (date: string) => {
      if (!couple?.id) return { error: 'Нет пары' }
      const { error } = await supabase
        .from('couples')
        .update({ together_since: date, status: 'active' })
        .eq('id', couple.id)
      if (!error) await refresh({ silent: true })
      return { error: error?.message ?? null }
    },
    [couple?.id, refresh],
  )

  const dissolve = useCallback(async () => {
    const { error } = await supabase.rpc('dissolve_couple')
    if (!error) {
      setCouple(null)
      setPartner(null)
      setMyRole(null)
      setMemberCount(0)
    }
    return { error: error?.message ?? null }
  }, [])

  const isComplete = Boolean(
    couple?.status === 'active' && couple?.together_since && memberCount >= 2,
  )

  const value = useMemo(
    () => ({
      couple,
      coupleId: couple?.id ?? null,
      myRole,
      partner,
      memberCount,
      loading,
      resolved,
      isComplete,
      refresh: () => refresh(),
      createCouple,
      joinCouple,
      setTogetherSince,
      dissolve,
    }),
    [
      couple,
      myRole,
      partner,
      memberCount,
      loading,
      resolved,
      isComplete,
      refresh,
      createCouple,
      joinCouple,
      setTogetherSince,
      dissolve,
    ],
  )

  return <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>
}

export function useCouple() {
  const ctx = useContext(CoupleContext)
  if (!ctx) throw new Error('useCouple must be used within CoupleProvider')
  return ctx
}

async function seedCoupleData(coupleId: string, _userId: string) {
  const { count } = await supabase
    .from('activity_ideas')
    .select('*', { count: 'exact', head: true })
    .eq('couple_id', coupleId)

  if (!count) {
    const { DEFAULT_ACTIVITY_IDEAS } = await import('../lib/constants')
    await supabase.from('activity_ideas').insert(
      DEFAULT_ACTIVITY_IDEAS.map((text) => ({
        couple_id: coupleId,
        text,
        is_custom: false,
      })),
    )
  }

}
