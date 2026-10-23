import type {
  AvailabilityQuery,
  AvailabilityResult,
  EventSpace,
  Reservation,
  TimeSlotSuggestion,
} from '@/types/domain'
import { addDays, isFutureDate, isIsoDate, parseClock, rangesOverlap, formatClock } from '@/utils/time'

const DAY_END = 23 * 60

function blockedInterval(start: number, end: number, turnoverMinutes: number): [number, number] {
  return [start, end + turnoverMinutes]
}

function overlapsBooking(
  start: number,
  end: number,
  bookingStart: number,
  bookingEnd: number,
  turnoverMinutes: number,
): boolean {
  const [requestedStart, requestedEnd] = blockedInterval(start, end, turnoverMinutes)
  const [occupiedStart, occupiedEnd] = blockedInterval(bookingStart, bookingEnd, turnoverMinutes)
  return rangesOverlap(requestedStart, requestedEnd, occupiedStart, occupiedEnd)
}

function unavailable(
  code: AvailabilityResult['code'],
  message: string,
  conflictingReservationId?: string,
): Omit<AvailabilityResult, 'alternatives'> {
  return {
    available: false,
    code,
    message,
    conflictingReservationId,
  }
}

export function evaluateAvailability(
  query: AvailabilityQuery,
  catalog: readonly EventSpace[],
  reservations: readonly Reservation[],
  now: Date = new Date(),
): Omit<AvailabilityResult, 'alternatives'> {
  const space = catalog.find((item) => item.id === query.spaceId)
  if (!space) {
    return unavailable('space_not_found', 'No encontramos ese espacio.')
  }

  if (!isIsoDate(query.date)) {
    return unavailable('invalid_date', 'Selecciona una fecha válida.')
  }

  if (!isFutureDate(query.date, now)) {
    return unavailable('past_date', 'La fecha debe ser posterior a hoy.')
  }

  const start = parseClock(query.startTime)
  const end = parseClock(query.endTime)
  if (start === null || end === null || end <= start) {
    return unavailable('invalid_time_range', 'La hora de finalización debe ser posterior a la de inicio.')
  }

  if (query.guests !== undefined && (!Number.isInteger(query.guests) || query.guests < 1)) {
    return unavailable('over_capacity', 'Indica un número entero de invitados, de uno en adelante.')
  }

  if (query.guests !== undefined && query.guests > space.capacityMax) {
    return unavailable(
      'over_capacity',
      `${space.name} admite hasta ${space.capacityMax} invitados.`,
    )
  }

  const conflict = reservations.find((reservation) => {
    if (reservation.status === 'cancelada') return false
    if (reservation.id === query.excludeReservationId) return false
    if (reservation.spaceId !== space.id || reservation.date !== query.date) return false
    const bookingStart = parseClock(reservation.startTime)
    const bookingEnd = parseClock(reservation.endTime)
    if (bookingStart === null || bookingEnd === null) return false
    return overlapsBooking(start, end, bookingStart, bookingEnd, space.turnoverMinutes)
  })

  if (conflict) {
    const transition =
      space.turnoverMinutes > 0
        ? ` Este espacio pide ${space.turnoverMinutes} minutos de transición entre eventos.`
        : ''
    return unavailable(
      'overlap',
      `Ese horario se cruza con otra reservación, de ${conflict.startTime} a ${conflict.endTime}.${transition}`,
      conflict.id,
    )
  }

  return {
    available: true,
    code: 'available',
    message: 'El horario está disponible.',
  }
}

function suggestAlternatives(
  query: AvailabilityQuery,
  catalog: readonly EventSpace[],
  reservations: readonly Reservation[],
  now: Date,
): TimeSlotSuggestion[] {
  const start = parseClock(query.startTime)
  const end = parseClock(query.endTime)
  if (start === null || end === null || end <= start || !isIsoDate(query.date)) return []

  const duration = end - start
  const suggestions: TimeSlotSuggestion[] = []
  const seen = new Set<string>()

  const push = (suggestion: TimeSlotSuggestion) => {
    const key = `${suggestion.spaceId}|${suggestion.date}|${suggestion.startTime}|${suggestion.endTime}`
    if (seen.has(key) || suggestions.length >= 3) return
    seen.add(key)
    suggestions.push(suggestion)
  }

  for (const space of catalog) {
    if (space.id === query.spaceId) continue
    if (query.guests !== undefined && query.guests > space.capacityMax) continue
    const result = evaluateAvailability({ ...query, spaceId: space.id }, catalog, reservations, now)
    if (!result.available) continue
    push({
      spaceId: space.id,
      spaceName: space.name,
      date: query.date,
      startTime: query.startTime,
      endTime: query.endTime,
      reason: 'Libre en el mismo horario',
    })
  }

  const current = catalog.find((space) => space.id === query.spaceId)
  if (current) {
    const conflictEnds = reservations
      .filter((reservation) => {
        if (reservation.status === 'cancelada' || reservation.spaceId !== current.id) return false
        if (reservation.date !== query.date) return false
        const bookingStart = parseClock(reservation.startTime)
        const bookingEnd = parseClock(reservation.endTime)
        if (bookingStart === null || bookingEnd === null) return false
        return overlapsBooking(start, end, bookingStart, bookingEnd, current.turnoverMinutes)
      })
      .map((reservation) => (parseClock(reservation.endTime) ?? 0) + current.turnoverMinutes)

    const nextStart = conflictEnds.length > 0 ? Math.max(...conflictEnds) : end
    const nextEnd = nextStart + duration
    if (nextEnd <= DAY_END && nextStart > start) {
      const startTime = formatClock(nextStart)
      const endTime = formatClock(nextEnd)
      const result = evaluateAvailability(
        { ...query, startTime, endTime },
        catalog,
        reservations,
        now,
      )
      if (result.available) {
        push({
          spaceId: current.id,
          spaceName: current.name,
          date: query.date,
          startTime,
          endTime,
          reason: 'Mismo espacio, más tarde',
        })
      }
    }

    const nextDate = addDays(query.date, 1)
    const tomorrow = evaluateAvailability({ ...query, date: nextDate }, catalog, reservations, now)
    if (tomorrow.available) {
      push({
        spaceId: current.id,
        spaceName: current.name,
        date: nextDate,
        startTime: query.startTime,
        endTime: query.endTime,
        reason: 'Mismo horario, al día siguiente',
      })
    }
  }

  return suggestions
}

export function checkAvailability(
  query: AvailabilityQuery,
  catalog: readonly EventSpace[],
  reservations: readonly Reservation[],
  now: Date = new Date(),
): AvailabilityResult {
  const evaluation = evaluateAvailability(query, catalog, reservations, now)
  if (evaluation.available || evaluation.code === 'past_date' || evaluation.code === 'invalid_date' || evaluation.code === 'invalid_time_range' || evaluation.code === 'space_not_found') {
    return { ...evaluation, alternatives: [] }
  }
  return {
    ...evaluation,
    alternatives: suggestAlternatives(query, catalog, reservations, now),
  }
}

export function countFreeSpaces(
  date: string,
  startTime: string,
  endTime: string,
  catalog: readonly EventSpace[],
  reservations: readonly Reservation[],
  guests: number | undefined,
  now: Date,
): number {
  return catalog.filter((space) => {
    return evaluateAvailability(
      { spaceId: space.id, date, startTime, endTime, guests },
      catalog,
      reservations,
      now,
    ).available
  }).length
}
