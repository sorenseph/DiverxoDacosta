<script setup lang="ts">
import PriceBreakdown from '@/components/booking/PriceBreakdown.vue'
import { serviceById } from '@/data/additionalServices'
import { cateringPackages } from '@/data/cateringPackages'
import { formatMxn } from '@/utils/money'
import { quoteEvent } from '@/services/pricingService'
import { getSpaceById } from '@/services/spacesService'
import { useBookingStore } from '@/stores/booking'
import { computed } from 'vue'

const booking = useBookingStore()
const space = computed(() => getSpaceById(booking.draft.spaceId))
const furnitureIncluded = computed(() => space.value?.includedConceptIds.includes('furniture') ?? false)
const waiterRate = serviceById('waiters')
const furnitureRate = serviceById('furniture')
const selectedPackage = computed(() => cateringPackages.find((item) => item.id === booking.draft.addons.cateringPackageId) ?? null)
const quote = computed(() => {
  if (!space.value || booking.draft.guests === null || booking.draft.guests < 1) return null
  return quoteEvent({
    space: space.value,
    guests: booking.draft.guests,
    startTime: booking.draft.startTime,
    endTime: booking.draft.endTime,
    addons: booking.draft.addons,
  })
})

</script>

<template>
  <div>
    <h2 tabindex="-1">Invitados y servicios</h2>
    <p class="lede" style="margin: 0.8rem 0 1.2rem">El banquete es opcional. Al cambiar los invitados, el presupuesto se recalcula con la tarifa por persona.</p>
    <div class="field" style="max-width: 240px">
      <label for="invitados">Número de asistentes</label>
      <input
        id="invitados"
        :value="booking.draft.guests ?? ''"
        type="number"
        min="1"
        :max="space?.capacityMax"
        inputmode="numeric"
        :aria-invalid="Boolean(booking.errors.guests)"
        :aria-describedby="booking.errors.guests ? 'invitados-error' : undefined"
        @input="booking.draft.guests = ($event.target as HTMLInputElement).value === '' ? null : Number(($event.target as HTMLInputElement).value)"
      />
      <p v-if="space" class="fine">{{ space.name }} admite hasta {{ space.capacityMax }} invitados.</p>
      <p v-if="booking.errors.guests" id="invitados-error" class="field-error" role="alert">{{ booking.errors.guests }}</p>
    </div>
    <fieldset style="border: 0; padding: 1.2rem 0 0; margin: 0">
      <legend class="eyebrow">Paquete de catering</legend>
      <div class="choice-grid">
        <label class="choice">
          <input
            type="radio"
            name="paquete"
            :checked="booking.draft.addons.cateringPackageId === null"
            @change="booking.draft.addons.cateringPackageId = null"
          />
          <h3>Sin catering</h3>
          <p>Solo la renta del espacio.</p>
        </label>
        <label v-for="item in cateringPackages" :key="item.id" class="choice">
          <input v-model="booking.draft.addons.cateringPackageId" type="radio" name="paquete" :value="item.id" />
          <h3>{{ item.name }}</h3>
          <p>{{ item.summary }} · {{ formatMxn(item.amountMxn) }} {{ item.charge === 'per_person' ? 'por persona' : 'por evento' }}</p>
        </label>
      </div>
    </fieldset>
    <p v-if="selectedPackage?.minGuests && booking.draft.guests !== null && booking.draft.guests < selectedPackage.minGuests" class="field-error" role="status">
      {{ selectedPackage.name }} pide un mínimo de {{ selectedPackage.minGuests }} invitados. El presupuesto se calcula con la cifra que escribas.
    </p>
    <fieldset style="border: 0; padding: 1.2rem 0 0; margin: 0">
      <legend class="eyebrow">Servicios aparte</legend>
      <label v-if="waiterRate" class="check-row">
        <input v-model="booking.draft.addons.waiters" type="checkbox" />
        {{ waiterRate.name }} — {{ formatMxn(waiterRate.amountMxn) }} por mesero
      </label>
      <label v-if="furnitureRate" class="check-row">
        <input v-model="booking.draft.addons.furniture" type="checkbox" :disabled="furnitureIncluded" />
        <span v-if="furnitureIncluded">Mobiliario incluido en la renta de este espacio</span>
        <span v-else>{{ furnitureRate.name }} — {{ formatMxn(furnitureRate.amountMxn) }} por persona</span>
      </label>
    </fieldset>
    <div v-if="quote" style="margin-top: 1.4rem">
      <PriceBreakdown :quote="quote" />
    </div>
  </div>
</template>
