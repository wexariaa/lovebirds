/**
 * Тест фич пары: чат, сердечко, крестики-нолики.
 * npm run test:features
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
const pass = 'testpass123'

function log(step, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${step}${detail ? ': ' + detail : ''}`)
}

async function setupCouple() {
  const clientA = createClient(url, key, { auth: { persistSession: false } })
  const clientB = createClient(url, key, { auth: { persistSession: false } })

  await clientA.auth.signUp({ email: `feat-a-${tag}@test.local`, password: pass })
  await clientB.auth.signUp({ email: `feat-b-${tag}@test.local`, password: pass })

  const userA = (await clientA.auth.getSession()).data.session?.user
  const userB = (await clientB.auth.getSession()).data.session?.user
  if (!userA || !userB) throw new Error('no session — disable email confirm')

  const coupleId = randomUUID()
  await clientA.from('couples').insert({ id: coupleId, status: 'active', together_since: '2024-01-01' })
  await clientA.from('couple_members').insert({ couple_id: coupleId, user_id: userA.id, role: 'a' })
  await clientB.rpc('join_couple', { p_couple_id: coupleId, p_together_since: '2024-01-01' })

  return { clientA, clientB, userA, userB, coupleId }
}

async function main() {
  console.log('Supabase:', url)
  console.log('---')

  const { clientA, clientB, userA, userB, coupleId } = await setupCouple()
  log('Active couple', true, coupleId)

  // Chat A → B sees
  const msg = `hello-${tag}`
  const { error: chatErr } = await clientA.from('chat_messages').insert({
    couple_id: coupleId,
    sender_id: userA.id,
    content: msg,
  })
  log('Chat insert A', !chatErr, chatErr?.message)

  const { data: chatB } = await clientB
    .from('chat_messages')
    .select('content')
    .eq('couple_id', coupleId)
    .eq('content', msg)
  log('Chat visible to B', (chatB?.length ?? 0) > 0)

  // Heart A → B sees
  const { error: heartErr } = await clientA.from('heart_pulses').insert({
    couple_id: coupleId,
    sender_id: userA.id,
  })
  log('Heart insert A', !heartErr, heartErr?.message)

  const { data: heartB } = await clientB
    .from('heart_pulses')
    .select('sender_id')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
    .limit(1)
  log('Heart visible to B', heartB?.[0]?.sender_id === userA.id)

  // TTT
  let { data: game } = await clientA
    .from('tic_tac_toe_games')
    .select('*')
    .eq('couple_id', coupleId)
    .maybeSingle()

  if (!game) {
    const { data: created, error } = await clientA.from('tic_tac_toe_games').insert({
      couple_id: coupleId,
      board: Array(9).fill(''),
      player_x: userA.id,
      player_o: userB.id,
      current_turn: userA.id,
      status: 'playing',
    }).select().single()
    game = created
    log('TTT create', !error, error?.message)
  } else {
    log('TTT exists', true)
  }

  const { data: gameB } = await clientB
    .from('tic_tac_toe_games')
    .select('player_x, player_o')
    .eq('couple_id', coupleId)
    .single()
  log('TTT visible to B', Boolean(gameB?.player_x && gameB?.player_o))

  const { error: moveErr } = await clientA
    .from('tic_tac_toe_games')
    .update({
      board: ['X', '', '', '', '', '', '', '', ''],
      current_turn: userB.id,
    })
    .eq('couple_id', coupleId)
  log('TTT move update', !moveErr, moveErr?.message)

  const { data: gameB2 } = await clientB
    .from('tic_tac_toe_games')
    .select('board, current_turn')
    .eq('couple_id', coupleId)
    .single()
  log('TTT sync board to B', gameB2?.board?.[0] === 'X' && gameB2?.current_turn === userB.id)

  // Savings
  const { error: savErr } = await clientA.from('savings_goals').upsert({
    couple_id: coupleId,
    goal_name: 'Test',
    target_amount: 1000,
    current_amount: 100,
  })
  const { data: savB } = await clientB.from('savings_goals').select('goal_name').eq('couple_id', coupleId).single()
  log('Savings shared', !savErr && savB?.goal_name === 'Test')

  // Mood
  const today = new Date().toISOString().slice(0, 10)
  await clientA.from('daily_moods').upsert({
    couple_id: coupleId,
    user_id: userA.id,
    emoji: '😊',
    mood_date: today,
  })
  const { data: moodB } = await clientB
    .from('daily_moods')
    .select('emoji')
    .eq('couple_id', coupleId)
    .eq('user_id', userA.id)
  log('Mood visible to B', moodB?.[0]?.emoji === '😊')

  console.log('---')
  const failed = [
    chatErr,
    (chatB?.length ?? 0) === 0,
    heartErr,
    heartB?.[0]?.sender_id !== userA.id,
    !gameB?.player_x,
    gameB2?.board?.[0] !== 'X',
    savErr || savB?.goal_name !== 'Test',
    moodB?.[0]?.emoji !== '😊',
  ].some(Boolean)
  if (failed) {
    console.log('⚠ Выполните supabase/fix-couple-rls.sql в SQL Editor (политики удалены fix-rls CASCADE)')
  }
  console.log('Для мгновенного sync: supabase/fix-realtime.sql')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
