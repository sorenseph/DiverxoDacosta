import { seedReservations } from '@/data/seed'
import { appDemoStore, quotesService, reservationsService } from '@/services/browserRepository'
import { quoteEvent } from '@/services/pricingService'
import { getSpaceById } from '@/services/spacesService'
import { loadBusySlots, loadClosures, pushQuote, pushReservation } from '@/services/cloudSync'
import { sendMail } from '@/services/mailClient'
import type { QuoteInput } from '@/services/quotesService'
import type { ConfirmOutcome } from '@/services/reservationsService'
import { cloudEnabled } from '@/services/supabase'
import type { BookingDraft, DateClosure, Reservation } from '@/types/domain'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const seedIds = new Set(seedReservations.map((item) => item.id))

export type ConfirmResult = ConfirmOutcome & { notice?: string }

export const useDemoStore = defineStore('demo', () => {
  const reservations = ref(reservationsService.list())
  const quotes = ref(quotesService.list())
  const closures = ref<DateClosure[]>(appDemoStore.read().closures ?? [])

  function refresh() {
    const database = appDemoStore.read()
    reservations.value = database.reservations
    quotes.value = database.quotes
    closures.value = database.closures ?? []
  }

  async function sendBookingCode(draft: BookingDraft, channel: 'email' | 'phone'): Promise<{ ok: true; ticket: string; hint: string } | { ok: false; message: string }> {
    const space = getSpaceById(draft.spaceId)
    const pricing = space && draft.guests
      ? quoteEvent({ space, guests: draft.guests, startTime: draft.startTime, endTime: draft.endTime, addons: draft.addons })
      : null
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', purpose: 'booking', channel, draft, pricing }),
    })
    const body = await response.json() as { ok?: boolean; ticket?: string; hint?: string; error?: string }
    if (!response.ok || !body.ticket) return { ok: false, message: body.error ?? 'No se pudo enviar el código.' }
    return { ok: true, ticket: body.ticket, hint: body.hint ?? '' }
  }

  async function confirm(ticket: string, code: string): Promise<ConfirmResult> {
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', purpose: 'booking', ticket, code }),
    })
    const body = await response.json() as { reservation?: Reservation; notice?: string; error?: string }
    if (!response.ok || !body.reservation) {
      refresh()
      return { ok: false, message: body.error ?? 'No se pudo confirmar el código.', availability: null }
    }
    const saved = reservationsService.remember(body.reservation)
    refresh()
    if (!saved.ok) return saved
    return { ...saved, notice: body.notice || undefined }
  }

  async function cancel(id: string) {
    const current = reservationsService.list().find((item) => item.id === id)
    const result = reservationsService.cancel(id)
    if (result && cloudEnabled) await pushReservation(result, null)
    if (result && current && !seedIds.has(current.id)) {
      await sendMail({
        kind: 'cancelacion',
        to: current.client.email,
        name: current.client.fullName,
        folio: current.folio,
      })
    }
    refresh()
    return result
  }

  async function submitQuote(input: QuoteInput) {
    const result = quotesService.submit(input)
    if (!result.ok) {
      refresh()
      return result
    }
    let notice = ''
    if (cloudEnabled) {
      const saved = await pushQuote(result.quote, null)
      if (saved) notice = saved
      const mailed = await sendMail({
        kind: 'cotizacion',
        to: result.quote.email,
        name: result.quote.name,
        message: result.quote.message,
      })
      if (mailed) notice = notice || 'La solicitud quedó guardada. El correo no pudo enviarse todavía.'
    }
    refresh()
    return { ...result, notice }
  }

  async function hydrateFromCloud() {
    if (!cloudEnabled) return
    const [remote, remoteClosures] = await Promise.all([loadBusySlots(), loadClosures()])
    const database = appDemoStore.read()
    const byId = new Map(database.reservations.map((item) => [item.id, item]))
    for (const slot of remote) {
      if (!byId.has(slot.id)) byId.set(slot.id, slot)
    }
    const closureById = new Map((database.closures ?? []).map((item) => [item.id, item]))
    for (const item of remoteClosures) closureById.set(item.id, item)
    appDemoStore.write({
      ...database,
      reservations: [...byId.values()],
      closures: [...closureById.values()],
    })
    refresh()
  }

  function resetDemo() {
    appDemoStore.reset()
    refresh()
  }

  return { reservations, quotes, closures, refresh, sendBookingCode, confirm, cancel, submitQuote, resetDemo, hydrateFromCloud }
})
