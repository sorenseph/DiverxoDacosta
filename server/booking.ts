const turnoverMinutes: Record<string, number> = {
  aurea: 0,
  magnolia: 0,
  nebula: 0,
  reserva: 30,
}

export const spaceNames: Record<string, string> = {
  aurea: 'Salón',
  magnolia: 'Jardín',
  nebula: 'Terraza',
  reserva: 'Salón principal',
}

function minutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const hours = Number(match[1])
  const mins = Number(match[2])
  if (hours > 23 || mins > 59) return null
  return hours * 60 + mins
}

function todayInMexico(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export interface BusyInterval {
  id: string
  spaceId: string
  date: string
  startTime: string
  endTime: string
  status: string
}

export interface ClosureInterval {
  spaceId: string | null
  date: string
  reason: string
}

export function bookingConflict(
  query: { spaceId: string; date: string; startTime: string; endTime: string },
  occupied: readonly BusyInterval[],
  closures: readonly ClosureInterval[],
  now = new Date(),
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(query.date) || query.date <= todayInMexico(now)) {
    return 'La fecha debe ser posterior a hoy.'
  }
  const start = minutes(query.startTime)
  const end = minutes(query.endTime)
  if (start === null || end === null || end <= start) return 'La hora de finalización debe ser posterior a la de inicio.'
  const closure = closures.find((item) => item.date === query.date && (item.spaceId === null || item.spaceId === query.spaceId))
  if (closure) return closure.reason.trim() || 'Ese día no tiene disponibilidad.'
  const turnover = turnoverMinutes[query.spaceId] ?? 0
  const hit = occupied.find((item) => {
    if (item.status === 'cancelada' || item.spaceId !== query.spaceId || item.date !== query.date) return false
    const bookingStart = minutes(item.startTime)
    const bookingEnd = minutes(item.endTime)
    if (bookingStart === null || bookingEnd === null) return false
    return start < bookingEnd + turnover && bookingStart < end + turnover
  })
  if (!hit) return null
  return `Ese horario se cruza con otra reservación, de ${hit.startTime} a ${hit.endTime}.`
}
