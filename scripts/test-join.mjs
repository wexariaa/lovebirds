/**
 * Диагностика join-flow. Запуск: npm run test:join
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
  console.error('Missing .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const tag = Date.now()
const emailA = `test-a-${tag}@test.local`
const emailB = `test-b-${tag}@test.local`
const pass = 'testpass123'

const results = []

function log(step, ok, detail = '') {
  results.push({ step, ok, detail })
  console.log(`${ok ? '✓' : '✗'} ${step}${detail ? ': ' + detail : ''}`)
}

async function main() {
  console.log('Supabase:', url)
  console.log('---')

  const clientA = createClient(url, key, { auth: { persistSession: false } })
  const clientB = createClient(url, key, { auth: { persistSession: false } })

  const { error: eA } = await clientA.auth.signUp({ email: emailA, password: pass })
  if (eA) {
    log('Signup A', false, eA.message)
    printSummary()
    return
  }
  log('Signup A', true, emailA)

  const userA = (await clientA.auth.getSession()).data.session?.user
  if (!userA) {
    log('Session A', false, 'нет сессии — отключите Confirm email в Supabase Auth')
    printSummary()
    return
  }

  const coupleId = randomUUID()
  const { error: cErr } = await clientA.from('couples').insert({ id: coupleId, status: 'pending' })
  log('Insert couples', !cErr, cErr?.message ?? coupleId)

  const { error: mErr } = await clientA.from('couple_members').insert({
    couple_id: coupleId,
    user_id: userA.id,
    role: 'a',
  })
  log('Insert member A', !mErr, mErr?.message)

  const { error: selfJoin } = await clientA.rpc('join_couple', {
    p_couple_id: coupleId,
    p_together_since: '2024-01-01',
  })
  const creatorMsg = selfJoin?.message ?? ''
  const creatorOk = Boolean(selfJoin) && creatorMsg.toLowerCase().includes('invite link')
  log(
    'Creator own link → понятная ошибка (fix-join v2)',
    creatorOk,
    creatorMsg || 'unexpected success',
  )

  const { error: eB } = await clientB.auth.signUp({ email: emailB, password: pass })
  log('Signup B', !eB, eB?.message ?? emailB)

  const userB = (await clientB.auth.getSession()).data.session?.user
  if (!userB) {
    log('Session B', false, 'нет сессии')
    printSummary()
    return
  }

  const t0 = Date.now()
  const { error: joinErr } = await clientB.rpc('join_couple', {
    p_couple_id: coupleId,
    p_together_since: '2024-06-01',
  })
  const ms = Date.now() - t0
  log('Partner B joins', !joinErr, joinErr?.message ?? `${ms}ms`)

  const { data: couple } = await clientB
    .from('couples')
    .select('status, together_since')
    .eq('id', coupleId)
    .single()
  log('Couple active', couple?.status === 'active', JSON.stringify(couple))

  const { error: retryErr } = await clientB.rpc('join_couple', {
    p_couple_id: coupleId,
    p_together_since: '2024-06-01',
  })
  log('B retry join (idempotent v2)', !retryErr, retryErr?.message ?? 'ok')

  const { data: inviteOk } = await clientB.rpc('check_invite_status', { p_couple_id: coupleId })
  log('check_invite_status after join', inviteOk === 'already_member', inviteOk ?? 'missing fn')

  const coupleId2 = randomUUID()
  await clientA.from('couples').insert({ id: coupleId2, status: 'pending' })
  await clientA.from('couple_members').insert({ couple_id: coupleId2, user_id: userA.id, role: 'a' })

  const clientC = createClient(url, key, { auth: { persistSession: false } })
  await clientC.auth.signUp({ email: `test-c-${tag}@test.local`, password: pass })
  const userC = (await clientC.auth.getSession()).data.session?.user
  if (userC) {
    const { data: invStatus } = await clientC.rpc('check_invite_status', {
      p_couple_id: coupleId2,
    })
    log('check_invite_status pending', invStatus === 'ok', invStatus ?? 'missing fn')

    const { data: inv, error: invErr } = await clientC
      .from('couples')
      .select('id, status')
      .eq('id', coupleId2)
      .single()
    log('Partner can read pending invite', Boolean(inv && !invErr), invErr?.message ?? inv?.status)
  }

  printSummary()
  await testBothCreated()
}

function printSummary() {
  console.log('---')
  const v2Retry = results.find((r) => r.step.startsWith('B retry'))
  const v2Creator = results.find((r) => r.step.startsWith('Creator own'))
  if (v2Retry && !v2Retry.ok) {
    console.log('⚠ На Supabase СТАРАЯ join_couple — выполните supabase/fix-join.sql в SQL Editor')
  }
  if (v2Creator && !v2Creator.ok) {
    console.log('⚠ Создатель видит «already in couple» вместо «your invite link» — тоже fix-join.sql v2')
  }
  if (v2Retry?.ok && v2Creator?.ok) {
    console.log('✓ fix-join.sql v2 применён корректно')
  }
  const checkFn = results.find((r) => r.step.startsWith('check_invite_status pending'))
  if (checkFn && !checkFn.ok) {
    console.log('⚠ Добавьте check_invite_status — перезапустите supabase/fix-join.sql в SQL Editor')
  }
  const bothTest = results.find((r) => r.step === 'B joins A after own link')
  if (bothTest && !bothTest.ok) {
    console.log('⚠ Оба создали ссылку — выполните supabase/fix-solo-pending.sql')
  }
  console.log('Тестовые пары остаются в БД (можно удалить в Table Editor)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
