import { eventKindOptions } from '@/data/content'
import { spaces } from '@/data/spaces'
import { checkAvailability } from '@/services/availabilityService'
import type { BookingDraft, EventKind, Reservation, ReservationDraft } from '@/types/domain'
import { isValidEmail, isValidPhone } from '@/utils/money'
import { isFutureDate, isIsoDate, parseClock } from '@/utils/time'

export interface FieldErrors {
  [field: string]: string | undefined
}

export interface ValidationResult {
  valid: boolean
  errors: FieldErrors
  messages: string[]
}

const eventIds = new Set<string>(eventKindOptions.map((item) => item.id))

export function isEventKind(value: string): value is EventKind {
  return eventIds.has(value)
}

function result(errors: FieldErrors): ValidationResult {
  const messages = Object.values(errors).filter((message): message is string => Boolean(message))
  return { valid: messages.length === 0, errors, messages }
}

export function createEmptyDraft(): BookingDraft {
  return {
    eventKind: '',
    date: '',
    startTime: '16:00',
    endTime: '22:00',
    spaceId: '',
    guests: null,
    addons: {
      cateringPackageId: null,
      waiters: false,
      furniture: false,
      decoration: false,
      extraIds: [],
    },
    client: {
      fullName: '',
      email: '',
      phone: '',
      notes: '',
    },
  }
}

export function validateSchedule(date: string, startTime: string, endTime: string, now: Date): FieldErrors {
  const errors: FieldErrors = {}
  if (!isIsoDate(date)) errors.date = 'Selecciona una fecha válida.'
  else if (!isFutureDate(date, now)) errors.date = 'La fecha debe ser posterior a hoy.'
  if (parseClock(startTime) === null) errors.startTime = 'Indica una hora de inicio válida.'
  if (parseClock(endTime) === null) errors.endTime = 'Indica una hora de cierre válida.'
  const start = parseClock(startTime)
  const end = parseClock(endTime)
  if (start !== null && end !== null && end <= start) {
    errors.endTime = 'La hora de finalización debe ser posterior a la de inicio.'
  }
  return errors
}

export function validateClient(draft: BookingDraft): FieldErrors {
  const errors: FieldErrors = {}
  const name = draft.client.fullName.trim()
  if (name.length < 3) errors.fullName = 'Escribe el nombre completo.'
  if (!isValidEmail(draft.client.email)) errors.email = 'Escribe un correo electrónico válido.'
  if (!isValidPhone(draft.client.phone)) errors.phone = 'Escribe un teléfono de 10 dígitos.'
  return errors
}

export function validateStep(
  step: number,
  draft: BookingDraft,
  reservations: readonly Reservation[],
  now: Date,
): ValidationResult {
  const errors: FieldErrors = {}

  if (step === 1 || step === 6) {
    if (!isEventKind(draft.eventKind)) errors.eventKind = 'Elige el tipo de evento.'
  }

  if (step === 2 || step === 6) {
    Object.assign(errors, validateSchedule(draft.date, draft.startTime, draft.endTime, now))
  }

  if (step === 3 || step === 6) {
    if (!draft.spaceId) errors.spaceId = 'Elige un espacio.'
    else if (!errors.date && !errors.startTime && !errors.endTime) {
      const availability = checkAvailability(
        {
          spaceId: draft.spaceId,
          date: draft.date,
          startTime: draft.startTime,
          endTime: draft.endTime,
          guests: step === 6 && draft.guests !== null ? draft.guests : undefined,
        },
        spaces,
        reservations,
        now,
      )
      if (!availability.available && availability.code !== 'over_capacity') {
        errors.spaceId = availability.message
      }
      if (step === 6 && availability.code === 'over_capacity') errors.guests = availability.message
    }
  }

  if (step === 4 || step === 6) {
    const space = spaces.find((item) => item.id === draft.spaceId)
    if (draft.guests === null || !Number.isInteger(draft.guests) || draft.guests < 1) {
      errors.guests = 'Indica cuántas personas asistirán.'
    } else if (space && draft.guests > space.capacityMax) {
      errors.guests = `${space.name} admite hasta ${space.capacityMax} invitados.`
    }
  }

  if (step === 5 || step === 6) {
    Object.assign(errors, validateClient(draft))
  }

  return result(errors)
}

export function toReservationDraft(draft: BookingDraft): ReservationDraft | null {
  if (!isEventKind(draft.eventKind) || draft.guests === null) return null
  return {
    eventKind: draft.eventKind,
    date: draft.date,
    startTime: draft.startTime,
    endTime: draft.endTime,
    spaceId: draft.spaceId,
    guests: draft.guests,
    addons: {
      cateringPackageId: draft.addons.cateringPackageId,
      waiters: draft.addons.waiters,
      furniture: draft.addons.furniture,
      decoration: draft.addons.decoration,
      extraIds: [...draft.addons.extraIds],
    },
    client: { ...draft.client, fullName: draft.client.fullName.trim(), notes: draft.client.notes.trim() },
  }
}
