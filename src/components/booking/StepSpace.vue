<script setup lang="ts">
import { spaceKindLabels } from '@/data/spaces'
import { checkAvailability } from '@/services/availabilityService'
import { listSpaces } from '@/services/spacesService'
import { useBookingStore } from '@/stores/booking'
import { useDemoStore } from '@/stores/demo'
import { formatMxn } from '@/utils/money'
import { Ban, CircleCheck } from '@lucide/vue'
import { computed } from 'vue'

const booking = useBookingStore()
const demo = useDemoStore()

const options = computed(() => listSpaces().map((space) => ({
  space,
  availability: checkAvailability(
    {
      spaceId: space.id,
      date: booking.draft.date,
      startTime: booking.draft.startTime,
      endTime: booking.draft.endTime,
    },
    listSpaces(),
    demo.reservations,
    new Date(),
    demo.closures,
  ),
})))
</script>

<template>
  <div>
    <h2 tabindex="-1">Elige el espacio</h2>
    <p class="lede" style="margin: 0.8rem 0 1.2rem">Elige el lugar según el número de invitados y el horario. Si uno está ocupado, los demás siguen disponibles.</p>
    <div class="choice-grid">
      <label v-for="option in options" :key="option.space.id" class="choice" :aria-pressed="booking.draft.spaceId === option.space.id">
        <input
          v-model="booking.draft.spaceId"
          type="radio"
          name="espacio"
          :value="option.space.id"
          :disabled="!option.availability.available"
        />
        <h3>{{ option.space.name }}</h3>
        <p>{{ spaceKindLabels[option.space.kind] }} · hasta {{ option.space.capacityMax }} invitados</p>
        <p class="price">{{ formatMxn(option.space.priceMxn) }}</p>
        <p class="fine">Por evento · {{ option.space.includedHours }} h incluidas</p>
        <p class="fine">{{ option.space.amenities.slice(0, 3).join(' · ') }}</p>
        <p class="status-note" :class="option.availability.available ? 'ok' : 'bad'">
          <CircleCheck v-if="option.availability.available" :size="16" aria-hidden="true" />
          <Ban v-else :size="16" aria-hidden="true" />
          <span>{{ option.availability.available ? 'Disponible en este horario' : option.availability.message }}</span>
        </p>
      </label>
    </div>
    <p v-if="booking.errors.spaceId" class="field-error" role="alert">{{ booking.errors.spaceId }}</p>
  </div>
</template>
