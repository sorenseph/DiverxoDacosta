<script setup lang="ts">
import StepClient from '@/components/booking/StepClient.vue'
import StepEvent from '@/components/booking/StepEvent.vue'
import StepIndicator from '@/components/booking/StepIndicator.vue'
import StepSchedule from '@/components/booking/StepSchedule.vue'
import StepServices from '@/components/booking/StepServices.vue'
import StepSpace from '@/components/booking/StepSpace.vue'
import StepSummary from '@/components/booking/StepSummary.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { cateringPackages } from '@/data/catering'
import { validateStep } from '@/services/bookingValidation'
import { getSpaceBySlug } from '@/services/spacesService'
import { useBookingStore } from '@/stores/booking'
import { useDemoStore } from '@/stores/demo'
import type { TimeSlotSuggestion } from '@/types/domain'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

usePageMeta(
  'Planea tu evento',
  'Elige el tipo de evento, la fecha, el espacio y los servicios para armar tu presupuesto.',
)

const booking = useBookingStore()
const demo = useDemoStore()
const route = useRoute()
const router = useRouter()
const { step, submitting } = storeToRefs(booking)
const heading = ref<HTMLElement | null>(null)
const panels = [StepEvent, StepSchedule, StepSpace, StepServices, StepClient, StepSummary]
const current = computed(() => panels[step.value - 1] ?? StepEvent)

onMounted(() => {
  const slug = typeof route.query.espacio === 'string' ? route.query.espacio : ''
  const packageId = typeof route.query.paquete === 'string' ? route.query.paquete : ''
  const space = slug ? getSpaceBySlug(slug) : undefined
  if (space) booking.draft.spaceId = space.id
  if (cateringPackages.some((item) => item.id === packageId)) booking.draft.addons.cateringPackageId = packageId
})

watch(step, async () => {
  await nextTick()
  heading.value?.querySelector('h2')?.focus()
})

function next() {
  const validation = validateStep(step.value, booking.draft, demo.reservations, new Date())
  booking.errors = validation.errors
  if (!validation.valid) return
  booking.clearFeedback()
  step.value += 1
}

function back() {
  booking.clearFeedback()
  step.value -= 1
}

async function confirmReservation() {
  booking.submitting = true
  const result = await demo.confirm(booking.draft, booking.accountPassword)
  booking.submitting = false
  if (!result.ok) {
    booking.confirmError = result.message
    booking.alternatives = result.availability?.alternatives ?? []
    return
  }
  const folio = result.reservation.folio
  const aviso = result.notice
  booking.resetDraft()
  void router.push({ name: 'confirmation', params: { folio }, query: aviso ? { aviso } : {} })
}

function applyAlternative(option: TimeSlotSuggestion) {
  booking.draft.spaceId = option.spaceId
  booking.draft.date = option.date
  booking.draft.startTime = option.startTime
  booking.draft.endTime = option.endTime
  booking.confirmError = ''
  booking.alternatives = []
}
</script>

<template>
  <section class="section">
    <div class="container">
      <p class="eyebrow">Tu evento</p>
      <h1 class="block-title">Planea tu evento.</h1>
      <p class="lede" style="margin: 1rem 0 2rem">Cuéntanos la ocasión, elige el espacio y los servicios, y revisa el presupuesto antes de enviar la solicitud.</p>
      <div class="booking-layout">
        <StepIndicator />
        <div ref="heading">
          <Transition name="step" mode="out-in">
            <component :is="current" :key="step" @apply="applyAlternative" />
          </Transition>
          <div class="actions" style="margin-top: 1.6rem">
            <button v-if="step > 1" class="btn btn-line btn-line-dark" type="button" @click="back">Anterior</button>
            <button v-if="step < 6" class="btn btn-dark" type="button" @click="next">Continuar</button>
            <button v-else class="btn btn-gold" type="button" :disabled="submitting" :aria-busy="submitting" :class="{ 'is-loading': submitting }" @click="confirmReservation">
              {{ submitting ? 'Enviando…' : 'Enviar solicitud' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
