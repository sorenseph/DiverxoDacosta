import { spaces } from '@/data/spaces'
import { checkAvailability } from '@/services/availabilityService'
import { toReservationDraft, validateStep } from '@/services/bookingValidation'
import type { DemoStore } from '@/services/demoStore'
import { DemoStoreError } from '@/services/demoStore'
import { quoteEvent } from '@/services/pricingService'
import type { AvailabilityResult, BookingDraft, Reservation } from '@/types/domain'
import { createFolio, createId } from '@/utils/ids'

export type ConfirmOutcome =
  | { ok: true; reservation: Reservation }
  | { ok: false; message: string; availability: AvailabilityResult | null }

export interface ReservationsService {
  list(): Reservation[]
  listActive(): Reservation[]
  getByFolio(folio: string): Reservation | undefined
  confirm(draft: BookingDraft, now?: Date): ConfirmOutcome
  cancel(id: string): Reservation | null
  reset(): void
}

export function createReservationsService(store: DemoStore, clock: () => Date = () => new Date()): ReservationsService {
  function list() {
    return store.read().reservations
  }

  function listActive() {
    return list().filter((reservation) => reservation.status !== 'cancelada')
  }

  function getByFolio(folio: string) {
    return list().find((reservation) => reservation.folio === folio)
  }

  function confirm(draft: BookingDraft, now = clock()): ConfirmOutcome {
    const validation = validateStep(6, draft, store.read().reservations, now)
    const reservationDraft = toReservationDraft(draft)
    const probed = draft.spaceId
      ? checkAvailability(
          {
            spaceId: draft.spaceId,
            date: draft.date,
            startTime: draft.startTime,
            endTime: draft.endTime,
            guests: draft.guests ?? undefined,
          },
          spaces,
          store.read().reservations,
          now,
        )
      : null

    if (!validation.valid || !reservationDraft) {
      return {
        ok: false,
        message: validation.messages[0] ?? 'Faltan datos obligatorios para confirmar.',
        availability: probed && !probed.available ? probed : null,
      }
    }

    if (!probed?.available) {
      return {
        ok: false,
        message: probed?.message ?? 'El horario ya no está disponible.',
        availability: probed,
      }
    }

    const fresh = store.read()
    const availability = checkAvailability(
      {
        spaceId: reservationDraft.spaceId,
        date: reservationDraft.date,
        startTime: reservationDraft.startTime,
        endTime: reservationDraft.endTime,
        guests: reservationDraft.guests,
      },
      spaces,
      fresh.reservations,
      now,
    )
    if (!availability.available) {
      return { ok: false, message: 'Ese horario acaba de ocuparse. Elige otra opción.', availability }
    }

    const space = spaces.find((item) => item.id === reservationDraft.spaceId)
    if (!space) {
      return { ok: false, message: 'No encontramos el espacio seleccionado.', availability }
    }

    const reservation: Reservation = {
      id: createId(),
      folio: createFolio(reservationDraft.date, fresh.reservations.map((item) => item.folio)),
      status: 'confirmada',
      createdAt: now.toISOString(),
      ...reservationDraft,
      pricing: quoteEvent({
        space,
        guests: reservationDraft.guests,
        startTime: reservationDraft.startTime,
        endTime: reservationDraft.endTime,
        addons: reservationDraft.addons,
      }),
    }

    const again = store.read()
    if (again.reservations.some((item) => item.id === reservation.id || item.folio === reservation.folio)) {
      return { ok: false, message: 'No se pudo generar un folio único. Intenta de nuevo.', availability: null }
    }

    const secondCheck = checkAvailability(
      {
        spaceId: reservation.spaceId,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        guests: reservation.guests,
      },
      spaces,
      again.reservations,
      now,
    )
    if (!secondCheck.available) {
      return {
        ok: false,
        message: 'Ese horario acaba de ocuparse. Elige otra opción.',
        availability: secondCheck,
      }
    }

    try {
      store.write({
        ...again,
        reservations: [...again.reservations, reservation],
      })
    } catch (error) {
      const message = error instanceof DemoStoreError ? error.message : 'No se pudo guardar la reservación. Inténtalo de nuevo.'
      return { ok: false, message, availability: null }
    }

    return { ok: true, reservation }
  }

  function cancel(id: string): Reservation | null {
    const database = store.read()
    const index = database.reservations.findIndex((item) => item.id === id)
    if (index < 0) return null
    const current = database.reservations[index]
    if (!current || current.status === 'cancelada') return current ?? null
    const updated: Reservation = { ...current, status: 'cancelada' }
    const reservations = database.reservations.slice()
    reservations[index] = updated
    store.write({ ...database, reservations })
    return updated
  }

  function reset() {
    store.reset()
  }

  return { list, listActive, getByFolio, confirm, cancel, reset }
}
