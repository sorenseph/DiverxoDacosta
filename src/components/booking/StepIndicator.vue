<script setup lang="ts">
import { useBookingStore } from '@/stores/booking'

const booking = useBookingStore()
const steps = [
  { id: 1, label: 'Tipo de evento' },
  { id: 2, label: 'Fecha y horario' },
  { id: 3, label: 'Espacio' },
  { id: 4, label: 'Invitados y servicios' },
  { id: 5, label: 'Tus datos' },
  { id: 6, label: 'Resumen' },
]

function go(id: number) {
  if (id >= booking.step) return
  booking.step = id
  booking.clearFeedback()
}
</script>

<template>
  <nav class="steps" aria-label="Progreso de la reservación">
    <button
      v-for="item in steps"
      :key="item.id"
      type="button"
      :aria-current="booking.step === item.id ? 'step' : undefined"
      :disabled="item.id > booking.step"
      @click="go(item.id)"
    >
      <span>Paso {{ item.id }}</span>
      <strong>{{ item.label }}</strong>
    </button>
  </nav>
</template>
