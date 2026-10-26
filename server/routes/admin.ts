/// <reference types="node" />
import { issueAdminToken, readAdminToken } from '../otp'
import { adminCredentialsMatch } from '../passwords'
import { createShift, createStaff, listTeam, removeShift, setStaffActive, type StaffShift } from '../staff'
import { spaceNames } from '../booking'
import {
  listClosures,
  listQuotes,
  listReservations,
  removeClosure,
  setReservationStatus,
  storeClosure,
  type ReservationRecord,
} from '../records'
import type { Reservation, ReservationStatus } from '../../src/types/domain'

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

function bearer(request: NodeRequest): string {
  const header = request.headers?.authorization ?? request.headers?.Authorization
  const value = Array.isArray(header) ? header[0] : header
  return value?.startsWith('Bearer ') ? value.slice(7).trim() : ''
}

function rowReservation(row: ReservationRecord): Reservation | null {
  const payload = row.payload
  if (!payload || typeof payload !== 'object' || !('client' in payload)) return null
  return { ...(payload as Reservation), id: row.id, folio: row.folio, status: row.status, spaceId: row.spaceId, date: row.date, startTime: row.startTime, endTime: row.endTime, guests: row.guests }
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
      username?: string
      password?: string
      fullName?: string
      active?: boolean
      staffId?: string
      activity?: string
      startTime?: string
      endTime?: string
      notes?: string
      id?: string
      status?: ReservationStatus
      date?: string
      spaceId?: string | null
      reason?: string
    }
    if (body.action === 'login') {
      if (typeof body.username !== 'string' || typeof body.password !== 'string' || !adminCredentialsMatch(body.username, body.password)) {
        response.status(401).json({ ok: false, error: 'Usuario o contraseña incorrectos.' })
        return
      }
      const token = issueAdminToken(body.username.trim().toLowerCase())
      if (!token) {
        response.status(500).json({ ok: false, error: 'No se pudo abrir la sesión.' })
        return
      }
      response.status(200).json({ ok: true, token, username: body.username.trim().toLowerCase() })
      return
    }
    const admin = readAdminToken(bearer(request))
    if (!admin) {
      response.status(401).json({ ok: false, error: 'La sesión de administración caducó. Entra de nuevo con tu usuario y contraseña.' })
      return
    }
    if (body.action === 'list') {
      const reservations = await listReservations()
      const quotes = await listQuotes()
      const closures = await listClosures()
      const team = await listTeam()
      response.status(200).json({
        ok: true,
        username: admin.username,
        reservations: reservations.rows.map(rowReservation).filter((item): item is Reservation => item !== null),
        quotes: quotes.rows.map((row) => row.payload),
        closures,
        staff: team.staff,
        shifts: team.shifts,
        notice: reservations.error || quotes.error || team.notice || '',
      })
      return
    }
    if (body.action === 'staff-create' && typeof body.fullName === 'string' && typeof body.username === 'string' && typeof body.password === 'string') {
      const created = await createStaff({ fullName: body.fullName, username: body.username, password: body.password })
      response.status(created.ok ? 200 : 400).json(created.ok ? { ok: true, staff: created.staff, notice: created.notice } : { ok: false, error: created.error })
      return
    }
    if (body.action === 'staff-active' && typeof body.id === 'string' && typeof body.active === 'boolean') {
      const error = await setStaffActive(body.id, body.active)
      response.status(error ? 400 : 200).json(error ? { ok: false, error } : { ok: true })
      return
    }
    if (body.action === 'shift-create' && typeof body.staffId === 'string' && typeof body.date === 'string' && typeof body.spaceId === 'string' && typeof body.activity === 'string' && typeof body.startTime === 'string' && typeof body.endTime === 'string') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date) || !spaceNames[body.spaceId] || body.activity.trim().length < 2) {
        response.status(400).json({ ok: false, error: 'Indica la fecha, el espacio y la actividad.' })
        return
      }
      if (!/^\d{2}:\d{2}$/.test(body.startTime) || !/^\d{2}:\d{2}$/.test(body.endTime) || body.endTime <= body.startTime) {
        response.status(400).json({ ok: false, error: 'La hora de salida debe ser posterior a la de entrada.' })
        return
      }
      const shift: StaffShift = {
        id: crypto.randomUUID(),
        staffId: body.staffId,
        date: body.date,
        spaceId: body.spaceId,
        activity: body.activity.trim().slice(0, 80),
        startTime: body.startTime,
        endTime: body.endTime,
        notes: typeof body.notes === 'string' ? body.notes.trim().slice(0, 240) : '',
      }
      const created = await createShift(shift)
      response.status(created.ok ? 200 : 400).json(created.ok ? { ok: true, shift: created.shift, notice: created.notice } : { ok: false, error: created.error })
      return
    }
    if (body.action === 'shift-remove' && typeof body.id === 'string') {
      const error = await removeShift(body.id)
      response.status(error ? 400 : 200).json(error ? { ok: false, error } : { ok: true })
      return
    }
    if (body.action === 'status' && typeof body.id === 'string' && (body.status === 'pendiente' || body.status === 'confirmada' || body.status === 'cancelada')) {
      const error = await setReservationStatus(body.id, body.status)
      response.status(error ? 502 : 200).json(error ? { ok: false, error } : { ok: true })
      return
    }
    if (body.action === 'close' && typeof body.date === 'string' && typeof body.reason === 'string') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date) || body.reason.trim().length < 3) {
        response.status(400).json({ ok: false, error: 'Indica la fecha y el motivo del cierre.' })
        return
      }
      const closure = {
        id: crypto.randomUUID(),
        spaceId: typeof body.spaceId === 'string' && body.spaceId ? body.spaceId : null,
        date: body.date,
        reason: body.reason.trim().slice(0, 180),
        createdAt: new Date().toISOString(),
      }
      const error = await storeClosure(closure)
      response.status(error ? 502 : 200).json(error ? { ok: false, error } : { ok: true, closure })
      return
    }
    if (body.action === 'open' && typeof body.id === 'string') {
      const error = await removeClosure(body.id)
      response.status(error ? 502 : 200).json(error ? { ok: false, error } : { ok: true })
      return
    }
    response.status(400).json({ ok: false, error: 'La solicitud está incompleta.' })
  } catch {
    response.status(400).json({ ok: false, error: 'No se pudo leer la solicitud.' })
  }
}
