/// <reference types="node" />
import { bookingConflict, spaceNames } from '../booking'
import { deliverMail, type MailLine } from '../mail'
import { matchCode, sendCode, type OtpChannel } from '../otp'
import { listClosures, listReservations, storeReservation, type ReservationRecord } from '../records'

interface NodeResponse {
  status: (code: number) => NodeResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

interface NodeRequest {
  method?: string
  body?: unknown
  headers?: Record<string, string | string[] | undefined>
  on: (event: string, listener: (chunk?: Buffer) => void) => void
}

interface DraftRecord {
  eventKind: string
  date: string
  startTime: string
  endTime: string
  spaceId: string
  guests: number
  addons: unknown
  client: { fullName: string; email: string; phone: string; notes: string }
}

interface StoredReservation extends DraftRecord {
  id: string
  folio: string
  status: 'pendiente' | 'confirmada' | 'cancelada'
  createdAt: string
  pricing: { lines: Array<MailLine & { id: string }>; totalMxn: number }
}

async function readJson(request: NodeRequest): Promise<unknown> {
  if (request.body && typeof request.body === 'object') return request.body
  if (typeof request.body === 'string') return JSON.parse(request.body) as unknown
  const raw = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk) => {
      if (chunk) chunks.push(chunk)
    })
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', () => reject(new Error('No se pudo leer la solicitud.')))
  })
  return raw ? JSON.parse(raw) as unknown : null
}

function channelOf(value: unknown): OtpChannel | null {
  return value === 'email' || value === 'phone' ? value : null
}

function asDraft(value: unknown): DraftRecord | null {
  if (!value || typeof value !== 'object') return null
  const draft = value as DraftRecord
  if (!draft.client || typeof draft.client.fullName !== 'string' || draft.client.fullName.trim().length < 3) return null
  if (typeof draft.client.email !== 'string' || typeof draft.client.phone !== 'string') return null
  if (typeof draft.spaceId !== 'string' || !spaceNames[draft.spaceId]) return null
  if (typeof draft.date !== 'string' || typeof draft.startTime !== 'string' || typeof draft.endTime !== 'string') return null
  if (typeof draft.guests !== 'number' || !Number.isInteger(draft.guests) || draft.guests < 1) return null
  if (typeof draft.eventKind !== 'string') return null
  return {
    ...draft,
    client: {
      fullName: draft.client.fullName.trim(),
      email: draft.client.email.trim(),
      phone: draft.client.phone.trim(),
      notes: typeof draft.client.notes === 'string' ? draft.client.notes.trim() : '',
    },
  }
}

function asPricing(value: unknown): { lines: Array<MailLine & { id: string }>; totalMxn: number } {
  if (!value || typeof value !== 'object') return { lines: [], totalMxn: 0 }
  const pricing = value as { lines?: unknown; totalMxn?: unknown }
  const lines = Array.isArray(pricing.lines)
    ? pricing.lines.flatMap((line, index) => {
        if (!line || typeof line !== 'object') return []
        const item = line as { id?: unknown; label?: unknown; detail?: unknown; amountMxn?: unknown }
        if (typeof item.amountMxn !== 'number') return []
        return [{
          id: typeof item.id === 'string' ? item.id : `linea-${index}`,
          label: typeof item.label === 'string' ? item.label : 'Concepto',
          detail: typeof item.detail === 'string' ? item.detail : '',
          amountMxn: item.amountMxn,
        }]
      })
    : []
  const totalMxn = typeof pricing.totalMxn === 'number' ? pricing.totalMxn : lines.reduce((sum, line) => sum + line.amountMxn, 0)
  return { lines, totalMxn }
}

function destinationOf(channel: OtpChannel, draft: DraftRecord): string | null {
  if (channel === 'email') {
    const email = draft.client.email.trim().toLowerCase()
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
  }
  const digits = draft.client.phone.replace(/\D/g, '')
  if (digits.length === 10) return digits
  if (digits.length === 12 && digits.startsWith('52')) return digits
  if (digits.length === 13 && digits.startsWith('521')) return digits
  return null
}

function lookupDestination(channel: OtpChannel, value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (channel === 'email') {
    const email = value.trim().toLowerCase()
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
  }
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10 || (digits.length === 12 && digits.startsWith('52')) || (digits.length === 13 && digits.startsWith('521'))) return digits
  return null
}

function sameContact(reservation: StoredReservation, channel: OtpChannel, destination: string): boolean {
  if (channel === 'email') return reservation.client.email.trim().toLowerCase() === destination
  return reservation.client.phone.replace(/\D/g, '') === destination
}

function rowReservation(row: ReservationRecord): StoredReservation | null {
  const payload = row.payload
  if (!payload || typeof payload !== 'object' || !('client' in payload)) return null
  const reservation = payload as StoredReservation
  return { ...reservation, id: row.id, folio: row.folio, status: row.status, spaceId: row.spaceId, date: row.date, startTime: row.startTime, endTime: row.endTime, guests: row.guests }
}

function folioFor(date: string, existing: readonly string[]): string {
  const compact = date.replaceAll('-', '')
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
    const folio = `DX-${compact}-${suffix}`
    if (!existing.includes(folio)) return folio
  }
  return `DX-${compact}-${Date.now().toString(36).toUpperCase()}`
}

function longDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return isoDate
  return new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(year, month - 1, day))
}

export default async function handler(request: NodeRequest, response: NodeResponse) {
  response.setHeader('Content-Type', 'application/json')
  if (request.method !== 'POST') {
    response.status(405).json({ ok: false, error: 'Método no permitido.' })
    return
  }
  try {
    const body = await readJson(request) as {
      action?: string
      purpose?: string
      channel?: unknown
      draft?: unknown
      pricing?: unknown
      ticket?: string
      code?: string
      destination?: unknown
    }
    const purpose = body.purpose === 'lookup' ? 'lookup' : 'booking'
    if (body.action === 'send') {
      if (purpose === 'lookup') {
        const channel = channelOf(body.channel)
        const destination = channel ? lookupDestination(channel, body.destination) : null
        if (!channel || !destination) {
          response.status(400).json({ ok: false, error: 'Escribe el correo o el teléfono de la reservación.' })
          return
        }
        const sent = await sendCode({ purpose: 'lookup', channel, destination, name: 'hola' })
        response.status(sent.ok ? 200 : 400).json(sent.ok ? { ok: true, ticket: sent.ticket, hint: sent.hint } : { ok: false, error: sent.error })
        return
      }
      const channel = channelOf(body.channel)
      const draft = asDraft(body.draft)
      const destination = channel && draft ? destinationOf(channel, draft) : null
      if (!channel || !draft || !destination) {
        response.status(400).json({ ok: false, error: 'Revisa los datos de contacto antes de pedir el código.' })
        return
      }
      const sent = await sendCode({
        purpose: 'booking',
        channel,
        destination,
        name: draft.client.fullName,
        draft,
        pricing: asPricing(body.pricing),
      })
      response.status(sent.ok ? 200 : 400).json(sent.ok ? { ok: true, ticket: sent.ticket, hint: sent.hint } : { ok: false, error: sent.error })
      return
    }
    if (body.action !== 'confirm' || typeof body.ticket !== 'string' || typeof body.code !== 'string') {
      response.status(400).json({ ok: false, error: 'Falta el código.' })
      return
    }
    const matched = matchCode(body.ticket, body.code, purpose)
    if (!matched.ok) {
      response.status(400).json({ ok: false, error: matched.error })
      return
    }
    if (purpose === 'lookup') {
      const listed = await listReservations()
      const reservations = listed.rows.map(rowReservation).filter((item): item is StoredReservation => item !== null)
        .filter((item) => sameContact(item, matched.body.channel, matched.body.destination))
      response.status(200).json({
        ok: true,
        channel: matched.body.channel,
        destination: matched.body.destination,
        reservations,
        notice: listed.error ? 'La consulta en la nube no está lista todavía. Mostramos lo que hay en este navegador.' : '',
      })
      return
    }
    const draft = asDraft(matched.body.draft)
    if (!draft) {
      response.status(400).json({ ok: false, error: 'La solicitud del código ya no coincide con el evento. Pide otro código.' })
      return
    }
    const listed = await listReservations()
    const closures = await listClosures()
    const occupied = listed.error ? [] : listed.rows
    const conflict = bookingConflict(draft, occupied, closures)
    if (conflict) {
      response.status(409).json({ ok: false, error: conflict })
      return
    }
    const pricing = asPricing(matched.body.pricing)
    const reservation: StoredReservation = {
      id: crypto.randomUUID(),
      folio: folioFor(draft.date, occupied.map((item) => item.folio)),
      status: 'confirmada',
      createdAt: new Date().toISOString(),
      ...draft,
      pricing,
    }
    const saved = await storeReservation({
      id: reservation.id,
      userId: null,
      folio: reservation.folio,
      status: reservation.status,
      spaceId: reservation.spaceId,
      date: reservation.date,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      guests: reservation.guests,
      payload: reservation,
    })
    const apiKey = process.env.RESEND_API_KEY ?? ''
    const mailed = apiKey
      ? await deliverMail({
          kind: 'reservacion',
          to: reservation.client.email,
          name: reservation.client.fullName,
          folio: reservation.folio,
          space: spaceNames[reservation.spaceId] ?? reservation.spaceId,
          when: `${longDate(reservation.date)} · ${reservation.startTime} a ${reservation.endTime}`,
          guests: reservation.guests,
          lines: reservation.pricing.lines,
          totalMxn: reservation.pricing.totalMxn,
        }, { apiKey, from: process.env.RESEND_FROM || 'DiverxoDacosta <israelcardenas6@gmail.com>' })
      : { ok: false as const, error: 'sin correo' }
    const notices = [
      saved ? 'Quedó confirmada en este navegador. En el panel aparecerá cuando la base esté lista.' : '',
      mailed.ok ? '' : 'La reservación quedó confirmada. El correo con la cotización no pudo enviarse todavía.',
    ].filter(Boolean)
    response.status(200).json({ ok: true, reservation, notice: notices.join(' ') })
  } catch {
    response.status(400).json({ ok: false, error: 'No se pudo leer la solicitud.' })
  }
}
