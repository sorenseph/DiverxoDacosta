/// <reference types="node" />
import { storeQuote, storeReservation, type QuoteRecord, type ReservationRecord } from '../records'

interface NodeResponse {
  status: (code: number) => NodeResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

interface NodeRequest {
  method?: string
  body?: unknown
  on: (event: string, listener: (chunk?: Buffer) => void) => void
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

function isReservation(value: unknown): value is ReservationRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as ReservationRecord
  return typeof record.id === 'string' && typeof record.folio === 'string' && typeof record.spaceId === 'string' && typeof record.date === 'string'
}

function isQuote(value: unknown): value is QuoteRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as QuoteRecord
  return typeof record.id === 'string' && typeof record.email === 'string'
}

export default async function handler(request: NodeRequest, response: NodeResponse) {
  response.setHeader('Content-Type', 'application/json')
  if (request.method !== 'POST') {
    response.status(405).json({ ok: false, error: 'Método no permitido.' })
    return
  }
  try {
    const body = await readJson(request) as { action?: string; reservation?: unknown; quote?: unknown }
    if (body.action === 'reservation' && isReservation(body.reservation)) {
      const error = await storeReservation(body.reservation)
      response.status(error ? 502 : 200).json(error ? { ok: false, error } : { ok: true })
      return
    }
    if (body.action === 'quote' && isQuote(body.quote)) {
      const error = await storeQuote(body.quote)
      response.status(error ? 502 : 200).json(error ? { ok: false, error } : { ok: true })
      return
    }
    response.status(400).json({ ok: false, error: 'La solicitud está incompleta.' })
  } catch {
    response.status(400).json({ ok: false, error: 'No se pudo leer la solicitud.' })
  }
}
