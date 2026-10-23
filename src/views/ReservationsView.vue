<script setup lang="ts">
import PriceBreakdown from '@/components/booking/PriceBreakdown.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { estimateNotice } from '@/data/pricingMeta'
import { useDemoStore } from '@/stores/demo'
import { formatLongDate, formatTimeRange } from '@/utils/money'
import { reservationEventLabel, reservationServices, reservationSpaceName, statusLabels } from '@/utils/reservationText'
import { Ban, CircleCheck, Clock3 } from '@lucide/vue'
import { computed, ref } from 'vue'

usePageMeta(
  'Reservaciones',
  'Consulta o cancela las reservaciones de tu evento con DiverxoDacosta.',
)

const demo = useDemoStore()
const pendingId = ref('')
const confirmReset = ref(false)
const ordered = computed(() => [...demo.reservations].sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`)))

async function cancel(id: string) {
  await demo.cancel(id)
  pendingId.value = ''
}

function reset() {
  demo.resetDemo()
  confirmReset.value = false
  pendingId.value = ''
}
</script>

<template>
  <section class="section">
    <div class="container">
      <p class="eyebrow">Tu agenda</p>
      <h1 class="block-title">Reservaciones.</h1>
      <p class="lede" style="margin: 1rem 0 0.6rem">
        Aquí aparecen las solicitudes de tu evento, con la renta, el banquete y los servicios de cada una. Si cancelas una, el horario vuelve a quedar libre.
      </p>
      <p class="fine" style="margin-bottom: 1.4rem">{{ estimateNotice }}</p>
      <div v-if="ordered.length === 0" class="empty-state">
        <h2>No hay reservaciones</h2>
        <p>Cuando envíes una solicitud, aparecerá aquí con su folio.</p>
        <RouterLink class="btn btn-dark" to="/reservar" style="margin-top: 1rem">Planear un evento</RouterLink>
      </div>
      <div v-else class="reservation-list">
        <article v-for="item in ordered" :key="item.id" class="reservation-card">
          <header>
            <div>
              <p class="eyebrow">{{ item.folio }}</p>
              <h2 style="font-size: 2rem">{{ reservationSpaceName(item) }}</h2>
            </div>
            <span class="badge">
              <CircleCheck v-if="item.status === 'confirmada'" :size="14" aria-hidden="true" />
              <Clock3 v-else-if="item.status === 'pendiente'" :size="14" aria-hidden="true" />
              <Ban v-else :size="14" aria-hidden="true" />
              {{ statusLabels[item.status] }}
            </span>
          </header>
          <p>{{ item.client.fullName }} · {{ reservationEventLabel(item) }}</p>
          <p>{{ formatLongDate(item.date) }} · {{ formatTimeRange(item.startTime, item.endTime) }} · {{ item.guests }} invitados</p>
          <p>{{ reservationServices(item).join(', ') }}</p>
          <PriceBreakdown :quote="item.pricing" :notice="false" />
          <div v-if="item.status !== 'cancelada'" class="actions">
            <button v-if="pendingId !== item.id" class="btn btn-line btn-line-dark" type="button" @click="pendingId = item.id">Cancelar reservación</button>
            <template v-else>
              <p role="alert">¿Cancelar {{ item.folio }} y liberar el horario?</p>
              <button class="btn btn-dark" type="button" @click="cancel(item.id)">Sí, cancelar</button>
              <button class="btn btn-line btn-line-dark" type="button" @click="pendingId = ''">No, conservar</button>
            </template>
          </div>
        </article>
      </div>
      <div id="restablecer" class="demo-callout" style="margin-top: 2rem">
        <h2 style="font-size: 2rem">Agenda de la casa</h2>
        <p>Recupera las reservaciones confirmadas y retira las solicitudes nuevas.</p>
        <div class="actions" style="margin-top: 0.8rem">
          <button v-if="!confirmReset" class="btn btn-line btn-line-dark" type="button" @click="confirmReset = true">Recuperar agenda</button>
          <template v-else>
            <button class="btn btn-dark" type="button" @click="reset">Confirmar restablecimiento</button>
            <button class="btn btn-line btn-line-dark" type="button" @click="confirmReset = false">Cancelar</button>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
