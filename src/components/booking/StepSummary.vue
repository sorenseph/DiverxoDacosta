<script setup lang="ts">
import PriceBreakdown from '@/components/booking/PriceBreakdown.vue'
import { eventKindLabels } from '@/data/content'
import { estimateNotice } from '@/data/pricingMeta'
import { quoteEvent } from '@/services/pricingService'
import { getSpaceById } from '@/services/spacesService'
import { useBookingStore } from '@/stores/booking'
import type { EventKind, TimeSlotSuggestion } from '@/types/domain'
import { reservationServices } from '@/utils/reservationText'
import { formatDuration, formatLongDate, formatTimeRange } from '@/utils/money'
import { computed } from 'vue'

const booking = useBookingStore()
const emit = defineEmits<{ apply: [suggestion: TimeSlotSuggestion] }>()
const space = computed(() => getSpaceById(booking.draft.spaceId))
const quote = computed(() => {
  if (!space.value || booking.draft.guests === null) return null
  return quoteEvent({
    space: space.value,
    guests: booking.draft.guests,
    startTime: booking.draft.startTime,
    endTime: booking.draft.endTime,
    addons: booking.draft.addons,
  })
})
const services = computed(() => {
  if (booking.draft.guests === null || !booking.draft.eventKind) return []
  return reservationServices({
    id: 'preview',
    folio: 'preview',
    status: 'pendiente',
    createdAt: '',
    eventKind: booking.draft.eventKind as EventKind,
    date: booking.draft.date,
    startTime: booking.draft.startTime,
    endTime: booking.draft.endTime,
    spaceId: booking.draft.spaceId,
    guests: booking.draft.guests,
    addons: booking.draft.addons,
    client: booking.draft.client,
    pricing: quote.value ?? { lines: [], totalMxn: 0 },
  })
})
</script>

<template>
  <div>
    <h2 tabindex="-1">Resumen</h2>
    <p class="lede" style="margin: 0.8rem 0 1.2rem">Revisa el estimado. Al confirmar se vuelve a comprobar que el horario siga libre.</p>
    <dl class="summary-list">
      <div><dt>Tipo de evento</dt><dd>{{ booking.draft.eventKind ? eventKindLabels[booking.draft.eventKind] : 'Por definir' }}</dd></div>
      <div><dt>Fecha</dt><dd>{{ booking.draft.date ? formatLongDate(booking.draft.date) : 'Por definir' }}</dd></div>
      <div><dt>Horario</dt><dd>{{ formatTimeRange(booking.draft.startTime, booking.draft.endTime) }} · {{ formatDuration(booking.draft.startTime, booking.draft.endTime) }}</dd></div>
      <div><dt>Espacio</dt><dd>{{ space?.name ?? 'Por definir' }}</dd></div>
      <div><dt>Invitados</dt><dd>{{ booking.draft.guests ?? 'Por definir' }}</dd></div>
      <div><dt>Servicios</dt><dd>{{ services.join(', ') }}</dd></div>
      <div><dt>Contacto</dt><dd>{{ booking.draft.client.fullName }}</dd></div>
    </dl>
    <PriceBreakdown v-if="quote" :quote="quote" />
    <p class="demo-callout" style="margin-top: 1rem">{{ estimateNotice }}</p>
    <p v-if="booking.confirmError" class="field-error" role="alert" style="margin-top: 1rem">{{ booking.confirmError }}</p>
    <div v-if="booking.alternatives.length" style="margin-top: 1rem">
      <p>Puedes elegir otra opción que sí está libre:</p>
      <div class="actions" style="margin-top: 0.7rem">
        <button v-for="option in booking.alternatives" :key="`${option.spaceId}-${option.date}-${option.startTime}`" type="button" class="btn btn-line btn-line-dark" @click="emit('apply', option)">
          {{ option.spaceName }} · {{ option.date }} · {{ option.startTime }} a {{ option.endTime }}
        </button>
      </div>
    </div>
  </div>
</template>
