/**
 * Диагностика join-flow. Запуск: node scripts/test-join.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'

function loadEnv() {
  const text = readFileSync('.env', 'utf8')
  const env = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim()
  }
  return env
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing .env')
  process.exit(1)
}

const tag = Date.now()
const emailA = `test-a-${tag}@test.local`
const emailB = `test-b-${tag}@test.local`
const pass = 'testpass123'

function log(step, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${step}${detail ? ': ' + detail : ''}`)
}

async function main() {
  console.log('Supabase:', url)
  console.log('---')

  const clientA = createClient(url, key, { auth: { persistSession: false } })
  const clientB = createClient(url, key, { auth: { persistSession: false } })

  // 1. Sign up A
  let { error: eA } = await clientA.auth.signUp({ email: emailA, password: pass })
  if (eA) {
    log('Signup A', false, eA.message)
    return
  }
  log('Signup A', true, emailA)

  const { data: sessA } = await clientA.auth.getSession()
  const userA = sessA.session?.user
  if (!userA) {
    log('Session A', false, 'no session — disable Confirm email in Supabase')
    return
  }

  // 2. Create couple as A
  const coupleId = randomUUID()
  let { error: cErr } = await clientA.from('couples').insert({ id: coupleId, status: 'pending' })
  log('Insert couples', !cErr, cErr?.message ?? coupleId)

  let { error: mErr } = await clientA.from('couple_members').insert({
    couple_id: coupleId,
    user_id: userA.id,
    role: 'a',
  })
  log('Insert member A', !mErr, mErr?.message)

  // 3. Creator tries own join link (common mistake)
  const { error: selfJoin } = await clientA.rpc('join_couple', {
    p_couple_id: coupleId,
    p_together_since: '2024-01-01',
  })
  log('Creator joins own link (expect fail)', Boolean(selfJoin), selfJoin?.message)

  // 4. Sign up B
  let { error: eB } = await clientB.auth.signUp({ email: emailB, password: pass })
  log('Signup B', !eB, eB?.message ?? emailB)

  const { data: sessB } = await clientB.auth.getSession()
  const userB = sessB.session?.user
  if (!userB) {
    log('Session B', false, 'no session')
    return
  }

  // 5. B joins
  const t0 = Date.now()
  const { error: joinErr } = await clientB.rpc('join_couple', {
    p_couple_id: coupleId,
    p_together_since: '2024-06-01',
  })
  const ms = Date.now() - t0
  log('Partner B joins', !joinErr, joinErr?.message ?? `${ms}ms`)

  // 6. Verify couple active
  const { data: couple } = await clientB.from('couples').select('status, together_since').eq('id', coupleId).single()
  log('Couple status', couple?.status === 'active', JSON.stringify(couple))

  // 7. B retry join (idempotency)
  const { error: retryErr } = await clientB.rpc('join_couple', {
    p_couple_id: coupleId,
    p_together_since: '2024-06-01',
  })
  log('B retry join (expect ok after fix)', !retryErr, retryErr?.message)

  // 8. Check invite read as B before join on new couple
  const coupleId2 = randomUUID()
  await clientA.from('couples').insert({ id: coupleId2, status: 'pending' })
  await clientA.from('couple_members').insert({ couple_id: coupleId2, user_id: userA.id, role: 'a' })

  const clientC = createClient(url, key, { auth: { persistSession: false } })
  await clientC.auth.signUp({ email: `test-c-${tag}@test.local`, password: pass })
  const userC = (await clientC.auth.getSession()).data.session?.user
  if (userC) {
    const { data: inv, error: invErr } = await clientC
      .from('couples')
      .select('id, status')
      .eq('id', coupleId2)
      .single()
    log('C can read pending invite', Boolean(inv && !invErr), invErr?.message ?? inv?.status)
  }

  console.log('---')
  console.log('Done. Test couple ids:', coupleId, coupleId2)
}

main().catch(console.error)
