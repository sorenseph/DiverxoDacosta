<script setup lang="ts">
import PriceBreakdown from '@/components/booking/PriceBreakdown.vue'
import type { PriceQuote } from '@/types/domain'

defineProps<{
  folio: string
  eventLabel: string
  dateLabel: string
  schedule: string
  spaceName: string
  guests: number
  services: string[]
  quote: PriceQuote
}>()
</script>

<template>
  <section class="confirm-panel">
    <p class="eyebrow">Solicitud recibida</p>
    <h1>Tu próximo gran momento comienza aquí.</h1>
    <p class="lede" style="margin: 1rem 0 1.2rem">
      Recibimos tu solicitud. Aquí está el resumen de tu evento y el folio para darle seguimiento.
    </p>
    <p class="folio" style="margin: 1.4rem 0 0.3rem">{{ folio }}</p>
    <p class="fine">Folio de referencia</p>
    <dl class="summary-list" style="margin: 1.6rem 0">
      <div><dt>Evento</dt><dd>{{ eventLabel }}</dd></div>
      <div><dt>Fecha</dt><dd>{{ dateLabel }}</dd></div>
      <div><dt>Horario</dt><dd>{{ schedule }}</dd></div>
      <div><dt>Espacio</dt><dd>{{ spaceName }}</dd></div>
      <div><dt>Invitados</dt><dd>{{ guests }}</dd></div>
      <div><dt>Servicios</dt><dd>{{ services.join(', ') }}</dd></div>
    </dl>
    <PriceBreakdown :quote="quote" />
  </section>
</template>
