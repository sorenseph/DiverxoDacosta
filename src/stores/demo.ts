import { ensureAccount, currentUser } from '@/services/account'
import { appDemoStore, quotesService, reservationsService } from '@/services/browserRepository'
import { loadBusySlots, pushQuote, pushReservation } from '@/services/cloudSync'
import { sendMail } from '@/services/mailClient'
import type { QuoteInput } from '@/services/quotesService'
import type { ConfirmOutcome } from '@/services/reservationsService'
import { cloudEnabled } from '@/services/supabase'
import type { BookingDraft } from '@/types/domain'
import { formatLongDate, formatTimeRange } from '@/utils/money'
import { reservationSpaceName } from '@/utils/reservationText'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ConfirmResult = ConfirmOutcome & { notice?: string }

export const useDemoStore = defineStore('demo', () => {
  const reservations = ref(reservationsService.list())
  const quotes = ref(quotesService.list())

  function refresh() {
    reservations.value = reservationsService.list()
    quotes.value = quotesService.list()
  }

  function dropReservation(id: string) {
    const database = appDemoStore.read()
    appDemoStore.write({
      ...database,
      reservations: database.reservations.filter((item) => item.id !== id),
    })
  }

  async function confirm(draft: BookingDraft, password = ''): Promise<ConfirmResult> {
    const result = reservationsService.confirm(draft)
    if (!result.ok || !cloudEnabled) {
      refresh()
      return result
    }
    const account = await ensureAccount(result.reservation.client.email, password, result.reservation.client.fullName)
    if (!account.ok) {
      dropReservation(result.reservation.id)
      refresh()
      return { ok: false, message: account.message, availability: null }
    }
    const saved = await pushReservation(result.reservation, account.userId)
    if (saved) {
      dropReservation(result.reservation.id)
      refresh()
      return { ok: false, message: saved, availability: null }
    }
    const mailed = await sendMail({
      kind: 'reservacion',
      to: result.reservation.client.email,
      name: result.reservation.client.fullName,
      folio: result.reservation.folio,
      space: reservationSpaceName(result.reservation),
      when: `${formatLongDate(result.reservation.date)} · ${formatTimeRange(result.reservation.startTime, result.reservation.endTime)}`,
      guests: result.reservation.guests,
      lines: result.reservation.pricing.lines,
      totalMxn: result.reservation.pricing.totalMxn,
    })
    refresh()
    return mailed
      ? { ...result, notice: 'La reservación quedó guardada. El correo no salió: hay que verificar el dominio del remitente en Resend.' }
      : result
  }

  async function cancel(id: string) {
    const current = reservationsService.list().find((item) => item.id === id)
    const result = reservationsService.cancel(id)
    if (result && cloudEnabled) {
      const user = await currentUser()
      await pushReservation(result, user?.id ?? null)
      if (user && current && current.client.email.toLowerCase() === user.email.toLowerCase()) {
        await sendMail({
          kind: 'cancelacion',
          to: current.client.email,
          name: current.client.fullName,
          folio: current.folio,
        })
      }
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
      const user = await currentUser()
      const saved = await pushQuote(result.quote, user?.id ?? null)
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
    const remote = await loadBusySlots()
    const database = appDemoStore.read()
    const byId = new Map(database.reservations.map((item) => [item.id, item]))
    for (const slot of remote) {
      if (!byId.has(slot.id)) byId.set(slot.id, slot)
    }
    appDemoStore.write({ ...database, reservations: [...byId.values()] })
    refresh()
  }

  function resetDemo() {
    appDemoStore.reset()
    refresh()
  }

  return { reservations, quotes, refresh, confirm, cancel, submitQuote, resetDemo, hydrateFromCloud }
})
