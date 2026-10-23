import type { DateClosure, QuoteRequest, Reservation, ReservationStatus } from '@/types/domain'

interface BusySlot {
  id: string
  space_id: string
  event_date: string
  start_time: string
  end_time: string
  status: string
}

function clock(value: string): string {
  return value.slice(0, 5)
}

export function slotToReservation(slot: BusySlot): Reservation {
  const status: ReservationStatus = slot.status === 'pendiente' || slot.status === 'cancelada' ? slot.status : 'confirmada'
  return {
    id: slot.id,
    folio: slot.id,
    status,
    createdAt: '',
    eventKind: 'otro',
    date: slot.event_date,
    startTime: clock(slot.start_time),
    endTime: clock(slot.end_time),
    spaceId: slot.space_id,
    guests: 1,
    addons: { cateringPackageId: null, waiters: false, furniture: false, decoration: false, extraIds: [] },
    client: { fullName: 'Reservación registrada', email: '', phone: '', notes: '' },
    pricing: { lines: [], totalMxn: 0 },
  }
}

export async function pushReservation(reservation: Reservation, userId: string | null): Promise<string | null> {
  const response = await fetch('/api/reservation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'reservation',
      reservation: {
        id: reservation.id,
        userId,
        folio: reservation.folio,
        status: reservation.status,
        spaceId: reservation.spaceId,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        guests: reservation.guests,
        payload: reservation,
      },
    }),
  })
  if (response.ok) return null
  const body = await response.json() as { error?: string }
  return body.error ?? 'No se pudo guardar la reservación.'
}

export async function pushQuote(quote: QuoteRequest, userId: string | null): Promise<string | null> {
  const response = await fetch('/api/reservation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'quote',
      quote: { id: quote.id, userId, email: quote.email, payload: quote },
    }),
  })
  if (response.ok) return null
  const body = await response.json() as { error?: string }
  return body.error ?? 'No se pudo guardar la cotización.'
}

export async function loadClosures(): Promise<DateClosure[]> {
  const { supabase } = await import('@/services/supabase')
  if (!supabase) return []
  const { data, error } = await supabase.rpc('diverxo_list_closures')
  if (error || !Array.isArray(data)) return []
  return (data as { id: string; space_id: string | null; event_date: string; reason: string }[]).map((item) => ({
    id: item.id,
    spaceId: item.space_id,
    date: String(item.event_date).slice(0, 10),
    reason: item.reason ?? '',
    createdAt: '',
  }))
}

export async function loadBusySlots(): Promise<Reservation[]> {
  const { supabase } = await import('@/services/supabase')
  if (!supabase) return []
  const { data, error } = await supabase.rpc('diverxo_list_busy_slots')
  if (error || !Array.isArray(data)) return []
  return (data as BusySlot[]).map(slotToReservation)
}
