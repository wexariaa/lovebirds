/** Повтор запроса при сетевых сбоях (мобильный интернет, cold start Supabase) */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 1500,
): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (i < attempts - 1) await sleep(delayMs * (i + 1))
    }
  }
  throw lastError
}

export async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function friendlyNetworkError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('already in a couple'))
    return 'Вы уже состоите в паре. Выйдите или зарегистрируйте новый аккаунт.'
  if (m.includes('invalid') || m.includes('expired'))
    return 'Ссылка недействительна или устарела.'
  if (m.includes('full'))
    return 'В этой паре уже два человека.'
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('abort'))
    return 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз через 10 секунд.'
  if (m.includes('pgrst202') || m.includes('join_couple'))
    return 'База не настроена: выполните fix-join.sql в Supabase SQL Editor.'
  return msg
}

export function isRetryableError(msg: string): boolean {
  const m = msg.toLowerCase()
  return m.includes('failed to fetch') || m.includes('network') || m.includes('abort') || m.includes('timeout')
}
