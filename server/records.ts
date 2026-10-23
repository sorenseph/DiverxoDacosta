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
