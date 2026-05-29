export function formatTogetherDuration(since: string): string {
  const start = new Date(since)
  const now = new Date()
  let years = now.getFullYear() - start.getFullYear()
  let months = now.getMonth() - start.getMonth()
  let days = now.getDate() - start.getDate()

  if (days < 0) {
    months -= 1
    const prev = new Date(now.getFullYear(), now.getMonth(), 0)
    days += prev.getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  const parts: string[] = []
  if (years > 0) parts.push(`${years} ${plural(years, 'год', 'года', 'лет')}`)
  if (months > 0) parts.push(`${months} ${plural(months, 'месяц', 'месяца', 'месяцев')}`)
  parts.push(`${Math.max(days, 0)} ${plural(Math.max(days, 0), 'день', 'дня', 'дней')}`)
  return parts.join(', ')
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

export function getNextImportantDate(
  dates: { title: string; event_date: string }[],
): { title: string; event_date: string; daysUntil: number } | null {
  if (!dates.length) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const withNext = dates.map((d) => {
    const ev = new Date(d.event_date)
    ev.setHours(0, 0, 0, 0)
    let next = new Date(ev)
    if (next < today) {
      next = new Date(ev)
      next.setFullYear(today.getFullYear() + 1)
    }
    const daysUntil = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return { ...d, daysUntil, sort: next.getTime() }
  })

  withNext.sort((a, b) => a.sort - b.sort)
  const first = withNext[0]
  return { title: first.title, event_date: first.event_date, daysUntil: first.daysUntil }
}

export function checkTttWinner(board: string[]): { winner: 'X' | 'O' | null; draw: boolean } {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ]
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as 'X' | 'O', draw: false }
    }
  }
  const full = board.every((c) => c !== '')
  return { winner: null, draw: full }
}

export function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
