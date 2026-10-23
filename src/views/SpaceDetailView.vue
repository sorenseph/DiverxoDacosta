<script setup lang="ts">
import AppImage from '@/components/ui/AppImage.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { spaceKindLabels } from '@/data/spaces'
import { getSpaceBySlug } from '@/services/spacesService'
import { formatMxn } from '@/utils/money'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const space = computed(() => getSpaceBySlug(slug.value))
const active = ref(0)

watch(space, () => {
  active.value = 0
})

const image = computed(() => space.value?.images[active.value] ?? space.value?.images[0])

usePageMeta(
  computed(() => space.value?.name ?? 'Espacio'),
  computed(() => space.value?.summary ?? 'Espacio para eventos de DiverxoDacosta.'),
)
</script>

<template>
  <section v-if="space" class="section">
    <div class="container detail-hero">
      <div>
        <div class="detail-stage">
          <Transition name="photo" mode="out-in">
            <AppImage v-if="image" :key="image.src" :src="image.src" :alt="image.alt" eager />
          </Transition>
        </div>
        <div class="thumbs">
          <button
            v-for="(item, index) in space.images"
            :key="item.src"
            type="button"
            :aria-pressed="active === index"
            :aria-label="`Ver imagen ${index + 1} de ${space.name}`"
            @click="active = index"
          >
            <AppImage :src="item.src" alt="" />
          </button>
        </div>
      </div>
      <div>
        <p class="eyebrow">{{ spaceKindLabels[space.kind] }}</p>
        <h1 class="block-title">{{ space.name }}</h1>
        <p style="margin: 1rem 0">{{ space.description }}</p>
        <p class="price">{{ formatMxn(space.priceMxn) }}</p>
        <p class="fine">Precio por evento · {{ space.includedHours }} h incluidas</p>
        <p class="fine">Hora adicional: {{ formatMxn(space.extraHourMxn) }} por hora</p>
        <div class="stat-grid">
          <div><span>Capacidad</span><strong>{{ space.capacityMin }} a {{ space.capacityMax }}</strong></div>
          <div><span>Ubicación</span><strong>{{ space.locationLabel }}</strong></div>
          <div><span>Transición</span><strong>{{ space.turnoverMinutes === 0 ? 'Horarios consecutivos posibles' : `${space.turnoverMinutes} min entre eventos` }}</strong></div>
          <div><span>Tipo</span><strong>{{ spaceKindLabels[space.kind] }}</strong></div>
        </div>
        <div class="actions">
          <RouterLink class="btn btn-dark" :to="{ path: '/reservar', query: { espacio: space.slug } }">Consultar disponibilidad</RouterLink>
          <RouterLink class="btn btn-line btn-line-dark" to="/espacios">Volver al catálogo</RouterLink>
        </div>
      </div>
    </div>
    <div class="container split" style="margin-top: 3rem">
      <div>
        <h2>Características</h2>
        <ul class="detail-list">
          <li v-for="item in space.amenities" :key="item">{{ item }}</li>
        </ul>
      </div>
      <div>
        <h2>Incluido en la renta</h2>
        <ul class="detail-list">
          <li v-for="item in space.includedServices" :key="item">{{ item }}</li>
        </ul>
      </div>
    </div>
  </section>
  <section v-else class="section">
    <div class="container empty-state">
      <h1>No encontramos ese espacio</h1>
      <p>Ese lugar no está en el catálogo. Vuelve al listado para elegir uno.</p>
      <RouterLink class="btn btn-dark" to="/espacios" style="margin-top: 1rem">Ver espacios</RouterLink>
    </div>
  </section>
</template>
