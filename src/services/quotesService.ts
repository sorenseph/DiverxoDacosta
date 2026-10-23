import type { FieldErrors } from '@/services/bookingValidation'
import { isEventKind } from '@/services/bookingValidation'
import type { DemoStore } from '@/services/demoStore'
import { DemoStoreError } from '@/services/demoStore'
import type { QuoteRequest } from '@/types/domain'
import { createId } from '@/utils/ids'
import { isValidEmail, isValidPhone } from '@/utils/money'
import { isFutureDate, isIsoDate } from '@/utils/time'

export interface QuoteInput {
  name: string
  email: string
  phone: string
  eventKind: string
  tentativeDate: string
  guests: number | null
  message: string
}

export type QuoteOutcome =
  | { ok: true; quote: QuoteRequest }
  | { ok: false; message: string; errors: FieldErrors }

export interface QuotesService {
  list(): QuoteRequest[]
  submit(input: QuoteInput, now?: Date): QuoteOutcome
  reset(): void
}

export function validateQuote(input: QuoteInput, now: Date): FieldErrors {
  const errors: FieldErrors = {}
  if (input.name.trim().length < 3) errors.name = 'Escribe tu nombre.'
  if (!isValidEmail(input.email)) errors.email = 'Escribe un correo electrónico válido.'
  if (input.phone.trim() && !isValidPhone(input.phone)) errors.phone = 'Si dejas un teléfono, usa 10 dígitos.'
  if (input.tentativeDate) {
    if (!isIsoDate(input.tentativeDate) || !isFutureDate(input.tentativeDate, now)) {
      errors.tentativeDate = 'La fecha tentativa debe ser posterior a hoy.'
    }
  }
  if (input.guests !== null && (!Number.isInteger(input.guests) || input.guests < 1)) {
    errors.guests = 'El número de invitados debe ser un entero mayor que cero.'
  }
  if (input.message.trim().length < 12) errors.message = 'Cuéntanos un poco más, con al menos una frase.'
  return errors
}

export function createQuotesService(store: DemoStore, clock: () => Date = () => new Date()): QuotesService {
  function list() {
    return store.read().quotes
  }

  function submit(input: QuoteInput, now = clock()): QuoteOutcome {
    const errors = validateQuote(input, now)
    const messages = Object.values(errors).filter((message): message is string => Boolean(message))
    if (messages.length > 0) {
      return { ok: false, message: messages[0] ?? 'Revisa el formulario.', errors }
    }

    const quote: QuoteRequest = {
      id: createId(),
      createdAt: now.toISOString(),
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      eventKind: isEventKind(input.eventKind) ? input.eventKind : '',
      tentativeDate: input.tentativeDate,
      guests: input.guests,
      message: input.message.trim(),
    }

    const database = store.read()
    if (database.quotes.some((item) => item.id === quote.id)) {
      return { ok: false, message: 'No se pudo registrar la solicitud. Intenta de nuevo.', errors: {} }
    }

    try {
      store.write({ ...database, quotes: [quote, ...database.quotes] })
    } catch (error) {
      const message = error instanceof DemoStoreError ? error.message : 'No se pudo guardar la solicitud.'
      return { ok: false, message, errors: {} }
    }

    return { ok: true, quote }
  }

  function reset() {
    store.reset()
  }

  return { list, submit, reset }
}
