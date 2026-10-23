import { durationMinutes } from '@/utils/time'

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

const longDate = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatMxn(amount: number): string {
  return money.format(amount)
}

export function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return isoDate
  return longDate.format(new Date(year, month - 1, day))
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} a ${end}`
}

export function formatDuration(start: string, end: string): string {
  const minutes = durationMinutes(start, end)
  if (minutes === null) return 'Horario por definir'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  if (rest === 0) return hours === 1 ? '1 hora' : `${hours} horas`
  return `${hours} h ${rest} min`
}

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function isValidPhone(value: string): boolean {
  const digits = phoneDigits(value)
  if (digits.length === 10) return true
  if (digits.length === 12 && digits.startsWith('52')) return true
  return digits.length === 13 && digits.startsWith('521')
}
