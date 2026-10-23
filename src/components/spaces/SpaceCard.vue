<script setup lang="ts">
import AppImage from '@/components/ui/AppImage.vue'
import { spaceKindLabels } from '@/data/spaces'
import type { AvailabilityResult, EventSpace } from '@/types/domain'
import { formatMxn } from '@/utils/money'
import { Ban, CircleCheck, MapPin, Users } from '@lucide/vue'

defineProps<{ space: EventSpace; availability: AvailabilityResult | null; reverse?: boolean }>()
</script>

<template>
  <article class="space-row" :class="{ reverse }">
    <div class="parallax">
      <div class="zoom">
        <AppImage :src="space.images[0]?.src ?? ''" :alt="space.images[0]?.alt ?? space.name" />
      </div>
    </div>
    <div>
      <p class="eyebrow">{{ spaceKindLabels[space.kind] }}</p>
      <h2 style="font-size: clamp(2.2rem, 4vw, 3.4rem)">{{ space.name }}</h2>
      <p style="margin-top: 0.7rem">{{ space.summary }}</p>
      <ul class="facts">
        <li><Users :size="16" aria-hidden="true" /> {{ space.capacityMin }} a {{ space.capacityMax }} invitados</li>
        <li><MapPin :size="16" aria-hidden="true" /> {{ space.locationLabel }}</li>
      </ul>
      <p class="price">{{ formatMxn(space.priceMxn) }}</p>
      <p class="fine">Por evento · {{ space.includedHours }} h incluidas</p>
      <p v-if="availability" class="status-note" :class="availability.available ? 'ok' : 'bad'">
        <CircleCheck v-if="availability.available" :size="18" aria-hidden="true" />
        <Ban v-else :size="18" aria-hidden="true" />
        <span>{{ availability.available ? 'Disponible para la fecha y hora elegidas' : availability.message }}</span>
      </p>
      <div class="actions">
        <RouterLink class="btn btn-dark" :to="`/espacios/${space.slug}`">Ver detalles</RouterLink>
        <RouterLink class="btn btn-line btn-line-dark" :to="{ path: '/reservar', query: { espacio: space.slug } }">Consultar disponibilidad</RouterLink>
      </div>
    </div>
  </article>
</template>
