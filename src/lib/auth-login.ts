/** Внутренний email для Supabase Auth (логин без почты) */
const AUTH_DOMAIN = 'lovebirds.internal'

export function loginToEmail(login: string): string {
  const normalized = normalizeLogin(login)
  return `${normalized}@${AUTH_DOMAIN}`
}

export function normalizeLogin(login: string): string {
  return login.trim().toLowerCase()
}

export function validateLogin(login: string): string | null {
  const n = normalizeLogin(login)
  if (n.length < 3) return 'Логин — минимум 3 символа'
  if (n.length > 24) return 'Логин — максимум 24 символа'
  if (!/^[a-z0-9_]+$/.test(n)) return 'Только латиница, цифры и _'
  return null
}

export function validateDisplayName(name: string): string | null {
  const t = name.trim()
  if (t.length < 2) return 'Имя — минимум 2 символа'
  if (t.length > 32) return 'Имя — максимум 32 символа'
  return null
}
