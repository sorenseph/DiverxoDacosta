<script setup lang="ts">
import AmbientVideo from '@/components/ui/AmbientVideo.vue'
import { cateringPackages } from '@/data/cateringPackages'
import { films } from '@/data/media'
import { formatMxn } from '@/utils/money'
import { ref } from 'vue'

const film = ref<{ toggle: () => void; paused: boolean } | null>(null)
</script>

<template>
  <section class="section ink-band cinema-band">
    <AmbientVideo ref="film" :src="films.plating.src" :poster="films.plating.poster" :label="films.plating.label" :show-control="false" />
    <div class="cinema-shade" aria-hidden="true"></div>
    <div class="container">
      <div class="section-head">
        <div>
          <p class="eyebrow">Gastronomía</p>
          <h2>Una experiencia memorable también se disfruta en la mesa.</h2>
        </div>
        <div class="hero-actions">
          <RouterLink class="btn btn-line" to="/catering">Ver catering</RouterLink>
          <button class="btn btn-line" type="button" @click="film?.toggle()">
            {{ film?.paused ? 'Reproducir video' : 'Pausar video' }}
          </button>
        </div>
      </div>
      <div class="package-grid">
        <article v-for="item in cateringPackages" :key="item.id" class="package-card">
          <h3>{{ item.name }}</h3>
          <p>{{ item.summary }}</p>
          <p class="price" style="margin-top: 1rem">{{ formatMxn(item.amountMxn) }}</p>
          <p class="fine">{{ item.charge === 'per_person' ? 'por persona' : 'por evento' }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
