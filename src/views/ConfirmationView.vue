<script setup lang="ts">
import ConfirmationPanel from '@/components/booking/ConfirmationPanel.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { useDemoStore } from '@/stores/demo'
import { formatDuration, formatLongDate, formatTimeRange } from '@/utils/money'
import { reservationEventLabel, reservationServices, reservationSpaceName } from '@/utils/reservationText'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const demo = useDemoStore()
const folio = computed(() => String(route.params.folio ?? ''))
const reservation = computed(() => demo.reservations.find((item) => item.folio === folio.value))

usePageMeta(
  computed(() => reservation.value ? `Reservación ${reservation.value.folio}` : 'Reservación'),
  'Resumen de tu solicitud de reservación con DiverxoDacosta.',
)
</script>

<template>
  <section class="section">
    <div v-if="reservation" class="container narrow">
      <ConfirmationPanel
        :folio="reservation.folio"
        :event-label="reservationEventLabel(reservation)"
        :date-label="formatLongDate(reservation.date)"
        :schedule="`${formatTimeRange(reservation.startTime, reservation.endTime)} · ${formatDuration(reservation.startTime, reservation.endTime)}`"
        :space-name="reservationSpaceName(reservation)"
        :guests="reservation.guests"
        :services="reservationServices(reservation)"
        :quote="reservation.pricing"
      />
      <p v-if="route.query.aviso" class="demo-callout" style="margin-top: 1rem">{{ route.query.aviso }}</p>
      <div class="actions" style="margin-top: 1.6rem">
        <RouterLink class="btn btn-dark" to="/espacios">Volver a espacios</RouterLink>
        <RouterLink class="btn btn-line btn-line-dark" to="/reservaciones">Ver reservaciones</RouterLink>
      </div>
    </div>
    <div v-else class="container empty-state">
      <h1>No encontramos ese folio</h1>
      <p>Revisa el número o vuelve a tus reservaciones.</p>
      <RouterLink class="btn btn-dark" to="/reservaciones" style="margin-top: 1rem">Ver reservaciones</RouterLink>
    </div>
  </section>
</template>
