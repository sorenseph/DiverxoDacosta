const MEXICO_TZ = 'America/Mexico_City'

export function todayInMexico(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MEXICO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  utc.setUTCDate(utc.getUTCDate() + days)
  const nextYear = utc.getUTCFullYear()
  const nextMonth = String(utc.getUTCMonth() + 1).padStart(2, '0')
  const nextDay = String(utc.getUTCDate()).padStart(2, '0')
  return `${nextYear}-${nextMonth}-${nextDay}`
}

export function parseClock(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim())
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function formatClock(minutes: number): string {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hours = Math.floor(normalized / 60)
  const mins = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/** Intervalos semiabiertos: el fin de uno puede coincidir con el inicio del otro. */
export function rangesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA
}

export function durationMinutes(startTime: string, endTime: string): number | null {
  const start = parseClock(startTime)
  const end = parseClock(endTime)
  if (start === null || end === null || end <= start) return null
  return end - start
}

export function isFutureDate(isoDate: string, now: Date = new Date()): boolean {
  return isIsoDate(isoDate) && isoDate > todayInMexico(now)
}
