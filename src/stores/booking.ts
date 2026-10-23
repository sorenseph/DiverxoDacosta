import { createEmptyDraft, type FieldErrors } from '@/services/bookingValidation'
import type { BookingDraft, TimeSlotSuggestion } from '@/types/domain'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const SESSION_KEY = 'diverxo-dacosta.booking.v1'

function readSession(): { step: number; draft: BookingDraft } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { step?: unknown; draft?: Partial<BookingDraft> }
    const empty = createEmptyDraft()
    const draft = parsed.draft
    return {
      step: typeof parsed.step === 'number' && parsed.step >= 1 && parsed.step <= 6 ? parsed.step : 1,
      draft: {
        ...empty,
        ...draft,
        addons: {
          ...empty.addons,
          ...draft?.addons,
          extraIds: Array.isArray(draft?.addons?.extraIds) ? draft.addons.extraIds : [],
        },
        client: { ...empty.client, ...draft?.client },
      },
    }
  } catch {
    return null
  }
}

export const useBookingStore = defineStore('booking', () => {
  const saved = readSession()
  const step = ref(saved?.step ?? 1)
  const draft = ref<BookingDraft>(saved?.draft ?? createEmptyDraft())
  const errors = ref<FieldErrors>({})
  const confirmError = ref('')
  const alternatives = ref<TimeSlotSuggestion[]>([])
  const submitting = ref(false)
  const channel = ref<'email' | 'phone'>('email')
  const ticket = ref('')
  const codeHint = ref('')
  const code = ref('')
  let holdPersistence = false

  watch([step, draft], () => {
    if (holdPersistence) return
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ step: step.value, draft: draft.value }))
    } catch {
      confirmError.value = 'No se pudo conservar el avance. Puedes continuar en esta visita.'
    }
  }, { deep: true, flush: 'sync' })

  function clearFeedback() {
    errors.value = {}
    confirmError.value = ''
    alternatives.value = []
  }

  function resetDraft() {
    holdPersistence = true
    draft.value = createEmptyDraft()
    channel.value = 'email'
    ticket.value = ''
    codeHint.value = ''
    code.value = ''
    step.value = 1
    clearFeedback()
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* Si el navegador bloquea la sesión, el borrador ya quedó vacío en memoria. */
    }
    holdPersistence = false
  }

  return { step, draft, errors, confirmError, alternatives, submitting, channel, ticket, codeHint, code, clearFeedback, resetDraft }
})
