import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { deliverMail } from './mail'
import { deliverSms } from './sms'

export type OtpChannel = 'email' | 'phone'

interface TicketBody {
  purpose: 'booking' | 'lookup' | 'admin'
  channel: OtpChannel
  destination: string
  codeHash: string
  exp: number
  nonce: string
  draft?: unknown
  pricing?: unknown
}

const attempts = new Map<string, number>()
const sentAt = new Map<string, number>()

function signingSecret(): string {
  return process.env.SUPABASE_SECRET_KEY || process.env.RESEND_API_KEY || ''
}

function mask(channel: OtpChannel, destination: string): string {
  if (channel === 'email') {
    const [user, domain] = destination.split('@')
    return `${(user ?? '').slice(0, 1)}•••@${domain ?? ''}`
  }
  return `•••${destination.replace(/\D/g, '').slice(-4)}`
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function issue(body: TicketBody, secret: string): string {
  const payload = Buffer.from(JSON.stringify(body)).toString('base64url')
  return `${payload}.${sign(payload, secret)}`
}

export function readTicket(ticket: string, secret: string): TicketBody | null {
  const [payload, signature] = ticket.split('.')
  if (!payload || !signature) return null
  const expected = sign(payload, secret)
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  try {
    const body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TicketBody
    if (!body || typeof body.exp !== 'number' || body.exp < Date.now()) return null
    if (typeof body.nonce !== 'string' || typeof body.codeHash !== 'string') return null
    return body
  } catch {
    return null
  }
}

function hashCode(secret: string, nonce: string, code: string): string {
  return createHash('sha256').update(`${secret}:${nonce}:${code}`).digest('hex')
}

async function deliver(channel: OtpChannel, destination: string, name: string, code: string): Promise<string | null> {
  if (channel === 'phone') {
    const sms = await deliverSms(destination, `DiverxoDacosta: tu código es ${code}. Caduca en 10 minutos.`)
    return sms.ok ? null : sms.error
  }
  const apiKey = process.env.RESEND_API_KEY ?? ''
  if (!apiKey) return 'Falta la clave de correo en el servidor.'
  const mailed = await deliverMail(
    { kind: 'codigo', to: destination, name, code },
    { apiKey, from: process.env.RESEND_FROM || 'DiverxoDacosta <israelcardenas6@gmail.com>' },
  )
  return mailed.ok ? null : mailed.error
}

export async function sendCode(input: {
  purpose: TicketBody['purpose']
  channel: OtpChannel
  destination: string
  name: string
  draft?: unknown
  pricing?: unknown
}): Promise<{ ok: true; ticket: string; hint: string } | { ok: false; error: string }> {
  const secret = signingSecret()
  if (!secret) return { ok: false, error: 'El servidor no tiene lista la firma de los códigos.' }
  const key = `${input.purpose}:${input.destination}`
  const previous = sentAt.get(key) ?? 0
  if (Date.now() - previous < 30_000) {
    return { ok: false, error: 'Espera unos segundos antes de pedir otro código.' }
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const nonce = randomInt(0, 1_000_000_000).toString(36)
  const error = await deliver(input.channel, input.destination, input.name, code)
  if (error) return { ok: false, error }
  sentAt.set(key, Date.now())
  attempts.set(nonce, 0)
  const ticket = issue({
    purpose: input.purpose,
    channel: input.channel,
    destination: input.destination,
    codeHash: hashCode(secret, nonce, code),
    exp: Date.now() + 10 * 60 * 1000,
    nonce,
    draft: input.draft,
    pricing: input.pricing,
  }, secret)
  return { ok: true, ticket, hint: mask(input.channel, input.destination) }
}

export function matchCode(ticket: string, code: string, purpose: TicketBody['purpose']): { ok: true; body: TicketBody } | { ok: false; error: string } {
  const secret = signingSecret()
  if (!secret) return { ok: false, error: 'El servidor no tiene lista la firma de los códigos.' }
  const body = readTicket(ticket, secret)
  if (!body || body.purpose !== purpose) return { ok: false, error: 'El código ya no es válido. Pide uno nuevo.' }
  const used = attempts.get(body.nonce) ?? 0
  if (used >= 5) return { ok: false, error: 'Demasiados intentos. Pide un código nuevo.' }
  const digest = hashCode(secret, body.nonce, code.replace(/\D/g, ''))
  const left = Buffer.from(digest)
  const right = Buffer.from(body.codeHash)
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    attempts.set(body.nonce, used + 1)
    return { ok: false, error: 'El código no coincide.' }
  }
  attempts.set(body.nonce, 5)
  return { ok: true, body }
}

function readSigned(token: string): { role?: string; username?: string; staffId?: string; exp?: number } | null {
  const secret = signingSecret()
  if (!secret) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = sign(payload, secret)
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: string; username?: string; staffId?: string; exp?: number }
  } catch {
    return null
  }
}

export function issueAdminToken(username: string): string | null {
  const secret = signingSecret()
  if (!secret) return null
  const payload = Buffer.from(JSON.stringify({ role: 'admin', username, exp: Date.now() + 12 * 60 * 60 * 1000 })).toString('base64url')
  return `${payload}.${sign(payload, secret)}`
}

export function readAdminToken(token: string): { username: string } | null {
  const body = readSigned(token)
  if (!body || body.role !== 'admin' || typeof body.username !== 'string' || typeof body.exp !== 'number' || body.exp < Date.now()) return null
  return { username: body.username }
}

export function issueStaffToken(staffId: string, username: string): string | null {
  const secret = signingSecret()
  if (!secret) return null
  const payload = Buffer.from(JSON.stringify({ role: 'staff', staffId, username, exp: Date.now() + 12 * 60 * 60 * 1000 })).toString('base64url')
  return `${payload}.${sign(payload, secret)}`
}

export function readStaffToken(token: string): { staffId: string; username: string } | null {
  const body = readSigned(token)
  if (!body || body.role !== 'staff' || typeof body.staffId !== 'string' || typeof body.username !== 'string' || typeof body.exp !== 'number' || body.exp < Date.now()) return null
  return { staffId: body.staffId, username: body.username }
}
