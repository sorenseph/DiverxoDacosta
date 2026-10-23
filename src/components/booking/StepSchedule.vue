<script setup lang="ts">
import { occupiedDateHints } from '@/data/content'
import { countFreeSpaces } from '@/services/availabilityService'
import { validateSchedule } from '@/services/bookingValidation'
import { listSpaces } from '@/services/spacesService'
import { useBookingStore } from '@/stores/booking'
import { useDemoStore } from '@/stores/demo'
import { addDays, todayInMexico } from '@/utils/time'
import { formatDuration } from '@/utils/money'
import { computed } from 'vue'

const booking = useBookingStore()
const demo = useDemoStore()
const minDate = addDays(todayInMexico(), 1)
const catalog = listSpaces()

const summary = computed(() => {
  const errors = validateSchedule(booking.draft.date, booking.draft.startTime, booking.draft.endTime, new Date())
  if (Object.keys(errors).length > 0) return ''
  const free = countFreeSpaces(
    booking.draft.date,
    booking.draft.startTime,
    booking.draft.endTime,
    catalog,
    demo.reservations,
    undefined,
    new Date(),
    demo.closures,
  )
  if (free === 0) return 'Ningún espacio está libre en ese horario. Puedes cambiar la hora o revisar otras opciones al elegir el lugar.'
  return free === 1
    ? 'Hay 1 espacio libre para ese horario.'
    : `Hay ${free} espacios libres para ese horario.`
})
</script>

<template>
  <div>
    <h2 tabindex="-1">Fecha y horario</h2>
    <p class="lede" style="margin: 0.8rem 0 1.2rem">Revisamos la agenda de cada espacio para que dos eventos no se crucen.</p>
    <div class="choice-grid">
      <div class="field">
        <label for="fecha">Fecha</label>
        <input id="fecha" v-model="booking.draft.date" type="date" :min="minDate" :aria-invalid="Boolean(booking.errors.date)" :aria-describedby="booking.errors.date ? 'fecha-error' : undefined" />
        <p v-if="booking.errors.date" id="fecha-error" class="field-error" role="alert">{{ booking.errors.date }}</p>
      </div>
      <div class="field">
        <label for="inicio">Hora de inicio</label>
        <input id="inicio" v-model="booking.draft.startTime" type="time" :aria-invalid="Boolean(booking.errors.startTime)" :aria-describedby="booking.errors.startTime ? 'inicio-error' : undefined" />
        <p v-if="booking.errors.startTime" id="inicio-error" class="field-error" role="alert">{{ booking.errors.startTime }}</p>
      </div>
      <div class="field">
        <label for="cierre">Hora de finalización</label>
        <input id="cierre" v-model="booking.draft.endTime" type="time" :aria-invalid="Boolean(booking.errors.endTime)" :aria-describedby="booking.errors.endTime ? 'cierre-error' : undefined" />
        <p v-if="booking.errors.endTime" id="cierre-error" class="field-error" role="alert">{{ booking.errors.endTime }}</p>
      </div>
      <div class="field">
        <span class="label">Duración del evento</span>
        <strong>{{ formatDuration(booking.draft.startTime, booking.draft.endTime) }}</strong>
      </div>
    </div>
    <p v-if="summary" class="demo-callout" style="margin-top: 1rem" role="status">{{ summary }}</p>
    <div style="margin-top: 1.2rem">
      <p class="eyebrow">Fechas con agenda</p>
      <ul class="detail-list">
        <li v-for="hint in occupiedDateHints" :key="hint">{{ hint }}</li>
      </ul>
    </div>
  </div>
</template>
