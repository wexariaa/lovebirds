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
  if (m.includes('your invite link') || m.includes('send it to your partner'))
    return 'Это ваша ссылка — отправьте её партнёру, не открывайте сами.'
  if (m.includes('different couple'))
    return 'Вы уже состоите в другой паре. Нажмите «Расстались» или войдите другим аккаунтом.'
  if (m.includes('already in a couple'))
    return 'Вы уже состоите в паре. Если только что связались — обновите страницу.'
  if (m.includes('not found'))
    return 'Ссылка не найдена. Попросите партнёра создать новую пару.'
  if (m.includes('no longer pending') || m.includes('not ready'))
    return 'Ссылка уже использована. Попросите партнёра создать новую пару.'
  if (m.includes('already full'))
    return 'В этой паре уже два человека.'
  if (m.includes('invalid') || m.includes('expired'))
    return 'Ссылка недействительна. Создайте новую пару и новую ссылку.'
  if (
    m.includes('failed to fetch') ||
    m.includes('load failed') ||
    m.includes('network') ||
    m.includes('abort') ||
    m.includes('econnreset')
  )
    return 'Нет связи с сервером. Подождите 10 сек и нажмите снова.'
  if (m.includes('pgrst202') || m.includes('join_couple'))
    return 'Выполните fix-join.sql в Supabase SQL Editor.'
  return msg
}

export function isRetryableError(msg: string): boolean {
  const m = msg.toLowerCase()
  return (
    m.includes('failed to fetch') ||
    m.includes('load failed') ||
    m.includes('network') ||
    m.includes('abort') ||
    m.includes('timeout') ||
    m.includes('econnreset')
  )
}
