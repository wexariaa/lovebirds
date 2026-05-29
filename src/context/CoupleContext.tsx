import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { Couple, Profile } from '../types/database'

interface CoupleState {
  couple: Couple | null
  coupleId: string | null
  myRole: 'a' | 'b' | null
  partner: Profile | null
  loading: boolean
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
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      if (!user) {
        setCouple(null)
        setMyRole(null)
        setPartner(null)
        return
      }

      const { data: membership, error: mErr } = await supabase
        .from('couple_members')
        .select('couple_id, role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (mErr) console.error('couple_members:', mErr.message)

      if (!membership) {
        setCouple(null)
        setMyRole(null)
        setPartner(null)
        return
      }

      setMyRole(membership.role)

      const { data: coupleData } = await supabase
        .from('couples')
        .select('*')
        .eq('id', membership.couple_id)
        .single()

      setCouple(coupleData)

      const { data: members } = await supabase
        .from('couple_members')
        .select('user_id')
        .eq('couple_id', membership.couple_id)

      const partnerId = members?.find((m) => m.user_id !== user.id)?.user_id
      if (partnerId) {
        const { data: partnerProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', partnerId)
          .single()
        setPartner(partnerProfile)
      } else {
        setPartner(null)
      }
    } catch (e) {
      console.error('couple refresh:', e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    setLoading(true)
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!couple?.id) return

    const channel = supabase
      .channel(`couple-${couple.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${couple.id}` },
        () => refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couple_members', filter: `couple_id=eq.${couple.id}` },
        () => refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [couple?.id, refresh])

  const createCouple = useCallback(async () => {
    if (!user) return { coupleId: null, error: 'Не авторизован' }

    const { data: existing } = await supabase
      .from('couple_members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (existing) return { coupleId: null, error: 'Вы уже в паре' }

    const coupleId = crypto.randomUUID()

    const { error: cErr } = await supabase
      .from('couples')
      .insert({ id: coupleId, status: 'pending' })
    if (cErr) return { coupleId: null, error: cErr.message }

    const { error: mErr } = await supabase.from('couple_members').insert({
      couple_id: coupleId,
      user_id: user.id,
      role: 'a',
    })
    if (mErr) return { coupleId: null, error: mErr.message }

    await refresh()
    return { coupleId, error: null }
  }, [user, refresh])

  const joinCouple = useCallback(
    async (coupleId: string, togetherSince: string) => {
      if (!user) return { error: 'Не авторизован' }

      const { error: mErr } = await supabase.from('couple_members').insert({
        couple_id: coupleId,
        user_id: user.id,
        role: 'b',
      })
      if (mErr) return { error: mErr.message }

      const { error: uErr } = await supabase
        .from('couples')
        .update({ status: 'active', together_since: togetherSince })
        .eq('id', coupleId)
      if (uErr) return { error: uErr.message }

      await seedCoupleData(coupleId, user.id)
      await refresh()
      return { error: null }
    },
    [user, refresh],
  )

  const setTogetherSince = useCallback(
    async (date: string) => {
      if (!couple?.id) return { error: 'Нет пары' }
      const { error } = await supabase
        .from('couples')
        .update({ together_since: date, status: 'active' })
        .eq('id', couple.id)
      if (!error) await refresh()
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
    }
    return { error: error?.message ?? null }
  }, [])

  const isComplete = Boolean(couple && partner && couple.status === 'active')

  const value = useMemo(
    () => ({
      couple,
      coupleId: couple?.id ?? null,
      myRole,
      partner,
      loading,
      isComplete,
      refresh,
      createCouple,
      joinCouple,
      setTogetherSince,
      dissolve,
    }),
    [
      couple,
      myRole,
      partner,
      loading,
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

async function seedCoupleData(coupleId: string, userId: string) {
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

  const { data: savings } = await supabase
    .from('savings_goals')
    .select('couple_id')
    .eq('couple_id', coupleId)
    .maybeSingle()
  if (!savings) await supabase.from('savings_goals').insert({ couple_id: coupleId })

  const { data: game } = await supabase
    .from('tic_tac_toe_games')
    .select('couple_id')
    .eq('couple_id', coupleId)
    .maybeSingle()
  if (!game) {
    await supabase.from('tic_tac_toe_games').insert({
      couple_id: coupleId,
      board: Array(9).fill(''),
      current_turn: userId,
      player_x: userId,
      status: 'playing',
    })
  }
}
