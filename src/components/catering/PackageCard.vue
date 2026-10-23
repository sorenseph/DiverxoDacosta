<script setup lang="ts">
import type { CateringPackage } from '@/types/domain'
import { formatMxn } from '@/utils/money'

defineProps<{ item: CateringPackage }>()
</script>

<template>
  <article class="package-card">
    <h3>{{ item.name }}</h3>
    <p>{{ item.summary }}</p>
    <p class="price" style="margin-top: 1rem">{{ formatMxn(item.amountMxn) }}</p>
    <p class="fine">{{ item.charge === 'per_person' ? 'por persona' : 'por evento' }} · MXN</p>
    <p v-if="item.minGuests" class="fine">Mínimo de {{ item.minGuests }} invitados</p>
    <p class="fine">Servicio de {{ item.serviceHours }} h</p>
    <ul>
      <li v-for="line in item.included" :key="line">{{ line }}</li>
    </ul>
    <p class="fine" style="margin-top: 0.8rem">No incluye: {{ item.excluded.join(', ') }}.</p>
    <p class="fine">{{ item.conditions }}</p>
    <RouterLink class="btn btn-dark" :to="{ path: '/reservar', query: { paquete: item.id } }">Agregar a mi cotización</RouterLink>
  </article>
</template>
