<script setup lang="ts">
import SpaceCard from '@/components/spaces/SpaceCard.vue'
import SpaceFilters from '@/components/spaces/SpaceFilters.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { filterSpaces, type SpaceQuery } from '@/services/spacesService'
import { useDemoStore } from '@/stores/demo'
import { computed, ref } from 'vue'

usePageMeta(
  'Espacios y salones',
  'Salón, jardín, terraza y salón principal para bodas, celebraciones y eventos de empresa.',
)

const demo = useDemoStore()
const query = ref<SpaceQuery>({
  kind: 'todos',
  guests: null,
  budgetMxn: null,
  date: '',
  startTime: '16:00',
  endTime: '22:00',
  availability: 'todas',
})

const result = computed(() => filterSpaces(query.value, demo.reservations, new Date(), demo.closures))
</script>

<template>
  <section class="section">
    <div class="container">
      <p class="eyebrow">Espacios</p>
      <h1 class="block-title">Espacios para recibir.</h1>
      <p class="lede" style="margin: 1rem 0 1.6rem">
        Cuatro lugares para una comida íntima o un banquete numeroso. Cada uno indica su capacidad, las horas incluidas y lo que trae la renta.
      </p>
      <SpaceFilters :query="query" :note="result.note" @change="query = $event" />
      <div v-if="result.items.length === 0" class="empty-state" style="margin-top: 1.5rem">
        <h2>Ningún espacio coincide</h2>
        <p>Prueba con otra fecha, un presupuesto más amplio o menos invitados.</p>
      </div>
      <SpaceCard
        v-for="(item, index) in result.items"
        :key="item.space.id"
        :space="item.space"
        :availability="item.availability"
        :reverse="index % 2 === 1"
      />
    </div>
  </section>
</template>
