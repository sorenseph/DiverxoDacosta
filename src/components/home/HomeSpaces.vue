<script setup lang="ts">
import AppImage from '@/components/ui/AppImage.vue'
import { spaceKindLabels } from '@/data/spaces'
import { listSpaces } from '@/services/spacesService'
import { formatMxn } from '@/utils/money'

const catalog = listSpaces()
const featured = catalog[0]
const rest = catalog.slice(1)
</script>

<template>
  <section class="section" style="padding-top: 0">
    <div class="container">
      <div class="section-head">
        <h2>Espacios destacados</h2>
        <RouterLink class="btn btn-line btn-line-dark" to="/espacios">Ver el catálogo</RouterLink>
      </div>
      <article v-if="featured" class="featured-space">
        <div class="parallax">
          <div class="zoom">
            <AppImage :src="featured.images[0]?.src ?? ''" :alt="featured.images[0]?.alt ?? featured.name" />
          </div>
        </div>
        <div class="featured-copy">
          <p class="eyebrow">{{ spaceKindLabels[featured.kind] }}</p>
          <h3 style="font-size: 3rem">{{ featured.name }}</h3>
          <p>{{ featured.summary }}</p>
          <p class="price">{{ formatMxn(featured.priceMxn) }}</p>
          <RouterLink class="btn btn-dark" :to="`/espacios/${featured.slug}`">Ver detalles</RouterLink>
        </div>
      </article>
      <div class="space-mini">
        <RouterLink v-for="space in rest" :key="space.id" :to="`/espacios/${space.slug}`">
          <AppImage :src="space.images[0]?.src ?? ''" :alt="space.images[0]?.alt ?? space.name" />
          <div>
            <p class="eyebrow">{{ spaceKindLabels[space.kind] }}</p>
            <h3>{{ space.name }}</h3>
            <p class="fine">Hasta {{ space.capacityMax }} invitados</p>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
