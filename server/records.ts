import { createClient } from '@supabase/supabase-js'

export interface ReservationRecord {
  id: string
  userId: string | null
  folio: string
  status: 'pendiente' | 'confirmada' | 'cancelada'
  spaceId: string
  date: string
  startTime: string
  endTime: string
  guests: number
  payload: unknown
}

export interface QuoteRecord {
  id: string
  userId: string | null
  email: string
  payload: unknown
}

function admin() {
  const url = process.env.VITE_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SECRET_KEY ?? ''
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function storeReservation(record: ReservationRecord): Promise<string | null> {
  const client = admin()
  if (!client) return 'Falta la clave de Supabase en el servidor.'
  const { error } = await client.from('diverxo_reservations').upsert({
    id: record.id,
    user_id: record.userId,
    folio: record.folio,
    status: record.status,
    space_id: record.spaceId,
    event_date: record.date,
    start_time: record.startTime,
    end_time: record.endTime,
    guests: record.guests,
    payload: record.payload,
  })
  return error?.message ?? null
}

export interface ClosureRecord {
  id: string
  spaceId: string | null
  date: string
  reason: string
  createdAt?: string
}

export async function listReservations(): Promise<{ rows: ReservationRecord[]; error: string | null }> {
  const client = admin()
  if (!client) return { rows: [], error: 'Falta la clave de Supabase en el servidor.' }
  const { data, error } = await client
    .from('diverxo_reservations')
    .select('id, user_id, folio, status, space_id, event_date, start_time, end_time, guests, payload, created_at')
    .order('event_date', { ascending: false })
  if (error) return { rows: [], error: error.message }
  const rows = (data ?? []).map((row) => ({
    id: String(row.id),
    userId: typeof row.user_id === 'string' ? row.user_id : null,
    folio: String(row.folio),
    status: row.status === 'pendiente' || row.status === 'cancelada' ? row.status : 'confirmada' as const,
    spaceId: String(row.space_id),
    date: String(row.event_date).slice(0, 10),
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
    guests: Number(row.guests),
    payload: row.payload,
  }))
  return { rows, error: null }
}

export async function listQuotes(): Promise<{ rows: QuoteRecord[]; error: string | null }> {
  const client = admin()
  if (!client) return { rows: [], error: 'Falta la clave de Supabase en el servidor.' }
  const { data, error } = await client.from('diverxo_quotes').select('id, user_id, email, payload').order('created_at', { ascending: false })
  if (error) return { rows: [], error: error.message }
  const rows = (data ?? []).map((row) => ({
    id: String(row.id),
    userId: typeof row.user_id === 'string' ? row.user_id : null,
    email: String(row.email),
    payload: row.payload,
  }))
  return { rows, error: null }
}

export async function listClosures(): Promise<ClosureRecord[]> {
  const client = admin()
  if (!client) return []
  const { data, error } = await client.from('diverxo_closures').select('id, space_id, event_date, reason, created_at')
  if (error || !data) return []
  return data.map((row) => ({
    id: String(row.id),
    spaceId: typeof row.space_id === 'string' ? row.space_id : null,
    date: String(row.event_date).slice(0, 10),
    reason: typeof row.reason === 'string' ? row.reason : '',
    createdAt: typeof row.created_at === 'string' ? row.created_at : undefined,
  }))
}

export async function storeClosure(record: ClosureRecord): Promise<string | null> {
  const client = admin()
  if (!client) return 'Falta la clave de Supabase en el servidor.'
  const { error } = await client.from('diverxo_closures').upsert({
    id: record.id,
    space_id: record.spaceId,
    event_date: record.date,
    reason: record.reason,
  })
  return error?.message ?? null
}

export async function removeClosure(id: string): Promise<string | null> {
  const client = admin()
  if (!client) return 'Falta la clave de Supabase en el servidor.'
  const { error } = await client.from('diverxo_closures').delete().eq('id', id)
  return error?.message ?? null
}

export async function setReservationStatus(id: string, status: ReservationRecord['status']): Promise<string | null> {
  const client = admin()
  if (!client) return 'Falta la clave de Supabase en el servidor.'
  const current = await client.from('diverxo_reservations').select('payload').eq('id', id).maybeSingle()
  const payload = current.data?.payload
  const nextPayload = payload && typeof payload === 'object' ? { ...payload, status } : payload
  const { error } = await client.from('diverxo_reservations').update({ status, payload: nextPayload }).eq('id', id)
  return error?.message ?? null
}

export async function storeQuote(record: QuoteRecord): Promise<string | null> {
  const client = admin()
  if (!client) return 'Falta la clave de Supabase en el servidor.'
  const { error } = await client.from('diverxo_quotes').upsert({
    id: record.id,
    user_id: record.userId,
    email: record.email,
    payload: record.payload,
  })
  return error?.message ?? null
}
