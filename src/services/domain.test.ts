import { serviceById } from '@/data/additionalServices'
import { cateringPackages } from '@/data/cateringPackages'
import { seedReservations } from '@/data/seed'
import { spaces } from '@/data/spaces'
import { checkAvailability } from '@/services/availabilityService'
import { createEmptyDraft } from '@/services/bookingValidation'
import { createDemoStore, createMemoryStorage } from '@/services/demoStore'
import { quoteEvent } from '@/services/pricingService'
import { createReservationsService } from '@/services/reservationsService'
import type { BookingDraft, Reservation } from '@/types/domain'
import { describe, expect, it } from 'vitest'

const NOW = new Date('2026-10-22T18:00:00-06:00')

function readyDraft(overrides: Partial<BookingDraft> = {}): BookingDraft {
  const base = createEmptyDraft()
  return {
    ...base,
    eventKind: 'boda',
    date: '2026-11-20',
    startTime: '16:00',
    endTime: '22:00',
    spaceId: 'aurea',
    guests: 80,
    ...overrides,
    addons: { ...base.addons, ...overrides.addons },
    client: {
      fullName: 'Mariana Herrera',
      email: 'mariana.herrera@gmail.com',
      phone: '5512345678',
      notes: '',
      ...overrides.client,
    },
  }
}

function occupied(partial: Pick<Reservation, 'id' | 'spaceId' | 'date' | 'startTime' | 'endTime'> & Partial<Reservation>): Reservation {
  const draft = readyDraft()
  return {
    id: partial.id,
    folio: partial.folio ?? `DX-${partial.id}`,
    status: partial.status ?? 'confirmada',
    createdAt: partial.createdAt ?? NOW.toISOString(),
    eventKind: partial.eventKind ?? 'boda',
    date: partial.date,
    startTime: partial.startTime,
    endTime: partial.endTime,
    spaceId: partial.spaceId,
    guests: partial.guests ?? 40,
    addons: partial.addons ?? draft.addons,
    client: partial.client ?? draft.client,
    pricing: partial.pricing ?? { lines: [], totalMxn: 1000 },
  }
}

describe('checkAvailability', () => {
  it('permite reservar un espacio libre', () => {
    const result = checkAvailability(
      { spaceId: 'magnolia', date: '2026-11-20', startTime: '13:00', endTime: '18:00', guests: 40 },
      spaces,
      [],
      NOW,
    )
    expect(result.available).toBe(true)
    expect(result.code).toBe('available')
  })

  it('rechaza un espacio ocupado y un horario que se traslapa', () => {
    const reservations = [occupied({ id: 'a', spaceId: 'aurea', date: '2026-11-14', startTime: '15:00', endTime: '19:00' })]
    const result = checkAvailability(
      { spaceId: 'aurea', date: '2026-11-14', startTime: '17:00', endTime: '20:00', guests: 50 },
      spaces,
      reservations,
      NOW,
    )
    expect(result.available).toBe(false)
    expect(result.code).toBe('overlap')
    expect(result.alternatives.length).toBeGreaterThan(0)
  })

  it('acepta horarios consecutivos cuando no hay tiempo de preparación', () => {
    const reservations = [occupied({ id: 'a', spaceId: 'aurea', date: '2026-11-14', startTime: '15:00', endTime: '19:00' })]
    const result = checkAvailability(
      { spaceId: 'aurea', date: '2026-11-14', startTime: '19:00', endTime: '21:00' },
      spaces,
      reservations,
      NOW,
    )
    expect(result.available).toBe(true)
  })

  it('exige la transición configurada antes de aceptar el siguiente horario', () => {
    const reservations = [occupied({ id: 'r', spaceId: 'reserva', date: '2026-11-14', startTime: '09:00', endTime: '14:00' })]
    const tooSoon = checkAvailability(
      { spaceId: 'reserva', date: '2026-11-14', startTime: '14:00', endTime: '18:00' },
      spaces,
      reservations,
      NOW,
    )
    const afterBuffer = checkAvailability(
      { spaceId: 'reserva', date: '2026-11-14', startTime: '14:30', endTime: '18:30' },
      spaces,
      reservations,
      NOW,
    )
    expect(tooSoon.available).toBe(false)
    expect(afterBuffer.available).toBe(true)
  })

  it('permite el mismo horario en otro espacio', () => {
    const reservations = [occupied({ id: 'a', spaceId: 'aurea', date: '2026-11-14', startTime: '15:00', endTime: '19:00' })]
    const result = checkAvailability(
      { spaceId: 'magnolia', date: '2026-11-14', startTime: '15:00', endTime: '19:00', guests: 40 },
      spaces,
      reservations,
      NOW,
    )
    expect(result.available).toBe(true)
  })

  it('rechaza una capacidad mayor a la del espacio', () => {
    const result = checkAvailability(
      { spaceId: 'aurea', date: '2026-11-20', startTime: '16:00', endTime: '22:00', guests: 181 },
      spaces,
      [],
      NOW,
    )
    expect(result.available).toBe(false)
    expect(result.code).toBe('over_capacity')
  })

  it('rechaza una fecha pasada', () => {
    const result = checkAvailability(
      { spaceId: 'aurea', date: '2026-10-01', startTime: '16:00', endTime: '22:00' },
      spaces,
      [],
      NOW,
    )
    expect(result.available).toBe(false)
    expect(result.code).toBe('past_date')
  })

  it('ignora una reservación cancelada', () => {
    const reservations = [
      occupied({ id: 'c', spaceId: 'aurea', date: '2026-11-21', startTime: '12:00', endTime: '16:00', status: 'cancelada' }),
    ]
    const result = checkAvailability(
      { spaceId: 'aurea', date: '2026-11-21', startTime: '12:00', endTime: '16:00' },
      spaces,
      reservations,
      NOW,
    )
    expect(result.available).toBe(true)
  })
})

describe('reservaciones', () => {
  it('no confirma si faltan datos obligatorios y no guarda nada', () => {
    const store = createDemoStore(createMemoryStorage())
    store.write({ reservations: [], quotes: [] })
    const service = createReservationsService(store, () => NOW)
    const outcome = service.confirm(readyDraft({ client: { fullName: '', email: '', phone: '', notes: '' } }))
    expect(outcome.ok).toBe(false)
    expect(service.list()).toHaveLength(0)
  })

  it('bloquea el horario al confirmar y lo libera al cancelar', () => {
    const store = createDemoStore(createMemoryStorage())
    store.write({ reservations: [], quotes: [] })
    const service = createReservationsService(store, () => NOW)
    const outcome = service.confirm(readyDraft())
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const blocked = checkAvailability(
      { spaceId: 'aurea', date: '2026-11-20', startTime: '18:00', endTime: '21:00', guests: 40 },
      spaces,
      service.list(),
      NOW,
    )
    expect(blocked.available).toBe(false)
    service.cancel(outcome.reservation.id)
    const freed = checkAvailability(
      { spaceId: 'aurea', date: '2026-11-20', startTime: '18:00', endTime: '21:00', guests: 40 },
      spaces,
      service.list(),
      NOW,
    )
    expect(freed.available).toBe(true)
    expect(service.list()[0]?.status).toBe('cancelada')
  })

  it('impide una segunda reservación en el mismo horario', () => {
    const store = createDemoStore(createMemoryStorage())
    store.write({ reservations: [], quotes: [] })
    const service = createReservationsService(store, () => NOW)
    expect(service.confirm(readyDraft()).ok).toBe(true)
    const second = service.confirm(readyDraft())
    expect(second.ok).toBe(false)
    expect(service.listActive()).toHaveLength(1)
  })

  it('conserva los datos al abrir de nuevo el mismo almacenamiento', () => {
    const storage = createMemoryStorage()
    const firstStore = createDemoStore(storage)
    firstStore.write({ reservations: [], quotes: [] })
    const first = createReservationsService(firstStore, () => NOW)
    const outcome = first.confirm(readyDraft())
    expect(outcome.ok).toBe(true)
    const second = createReservationsService(createDemoStore(storage), () => NOW)
    expect(second.list()).toHaveLength(1)
    if (outcome.ok) expect(second.getByFolio(outcome.reservation.folio)?.spaceId).toBe('aurea')
  })

  it('no modifica las reservaciones iniciales importadas', () => {
    const original = seedReservations[0]?.status
    const store = createDemoStore(createMemoryStorage())
    const copy = store.read()
    if (copy.reservations[0]) copy.reservations[0].status = 'cancelada'
    expect(seedReservations[0]?.status).toBe(original)
    expect(store.read().reservations[0]?.status).toBe(original)
  })
})

describe('quoteEvent', () => {
  it('suma renta, banquete por persona, meseros y mobiliario sin cobrar extras no configurados', () => {
    const space = spaces.find((item) => item.id === 'aurea')
    const banquet = cateringPackages.find((item) => item.id === 'banquete-intermedio')
    const waiters = serviceById('waiters')
    const furniture = serviceById('furniture')
    if (!space || !banquet || !waiters?.guestsPerUnit || !furniture) throw new Error('Falta la tarifa de prueba')
    const guests = 80
    const quote = quoteEvent({
      space,
      guests,
      startTime: '16:00',
      endTime: '22:00',
      addons: {
        cateringPackageId: banquet.id,
        waiters: true,
        furniture: true,
        decoration: true,
        extraIds: ['audio', 'barra'],
      },
    })
    const expected =
      space.priceMxn +
      banquet.amountMxn * guests +
      Math.ceil(guests / waiters.guestsPerUnit) * waiters.amountMxn +
      furniture.amountMxn * guests
    expect(quote.totalMxn).toBe(expected)
    expect(quote.lines.reduce((sum, line) => sum + line.amountMxn, 0)).toBe(expected)
    expect(quote.lines.some((item) => item.id === 'decoration' || item.id === 'extra-audio')).toBe(false)
  })

  it('no vuelve a cobrar el mobiliario cuando la renta ya lo incluye', () => {
    const space = spaces.find((item) => item.id === 'nebula')
    const furniture = serviceById('furniture')
    if (!space || !furniture) throw new Error('Falta el espacio con mobiliario')
    const quote = quoteEvent({
      space,
      guests: 20,
      startTime: '16:00',
      endTime: '21:00',
      addons: { cateringPackageId: null, waiters: false, furniture: true, decoration: false, extraIds: [] },
    })
    expect(quote.lines.find((item) => item.id === 'furniture')?.amountMxn).toBe(0)
    expect(quote.totalMxn).toBe(space.priceMxn)
  })

  it('cobra horas adicionales cuando el evento supera el tiempo incluido', () => {
    const space = spaces.find((item) => item.id === 'aurea')
    if (!space) throw new Error('Falta el espacio de prueba')
    const quote = quoteEvent({
      space,
      guests: 40,
      startTime: '08:00',
      endTime: '18:00',
      addons: { cateringPackageId: null, waiters: false, furniture: false, decoration: false, extraIds: [] },
    })
    const extraHours = 10 - space.includedHours
    expect(extraHours).toBeGreaterThan(0)
    expect(quote.totalMxn).toBe(space.priceMxn + extraHours * space.extraHourMxn)
  })

  it('conserva el importe guardado aunque la renta vigente sea otra', () => {
    const store = createDemoStore(createMemoryStorage())
    store.write({ reservations: [], quotes: [] })
    const service = createReservationsService(store, () => NOW)
    const outcome = service.confirm(readyDraft({
      addons: { cateringPackageId: 'banquete-intermedio', waiters: false, furniture: false, decoration: false, extraIds: [] },
    }))
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const saved = outcome.reservation.pricing.totalMxn
    const space = spaces.find((item) => item.id === 'aurea')
    if (!space) throw new Error('Falta el espacio de prueba')
    const revised = quoteEvent({
      space: { ...space, priceMxn: space.priceMxn + 50000 },
      guests: 80,
      startTime: '16:00',
      endTime: '22:00',
      addons: outcome.reservation.addons,
    })
    expect(revised.totalMxn).not.toBe(saved)
    expect(service.getByFolio(outcome.reservation.folio)?.pricing.totalMxn).toBe(saved)
    expect(seedReservations[0]?.pricing.lines.some((line) => line.id === 'space')).toBe(true)
    expect(seedReservations[0]?.pricing.totalMxn).toBe(
      seedReservations[0]?.pricing.lines.reduce((sum, line) => sum + line.amountMxn, 0),
    )
  })
})
