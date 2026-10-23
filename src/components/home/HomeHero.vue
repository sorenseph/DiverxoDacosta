<script setup lang="ts">
import AmbientVideo from '@/components/ui/AmbientVideo.vue'
import { films } from '@/data/media'
import { ref } from 'vue'

const lines = ['Los momentos', 'extraordinarios', 'merecen un lugar', 'especial.']
const film = ref<{ toggle: () => void; paused: boolean } | null>(null)
</script>

<template>
  <section class="hero">
    <AmbientVideo ref="film" :src="films.table.src" :poster="films.table.poster" :label="films.table.label" :show-control="false" />
    <div class="hero-shade" aria-hidden="true"></div>
    <div class="hero-copy">
      <p class="eyebrow hero-fade">DiverXo Dacosta · El arte de servir</p>
      <h1>
        <span v-for="(line, index) in lines" :key="line" class="line" :style="{ '--d': `${index * 110}ms` }">
          <span>{{ line }}</span>
        </span>
      </h1>
      <p class="lede hero-fade" style="--d: 480ms">
        En DiverxoDacosta creamos experiencias que reúnen a las personas alrededor de grandes momentos. Descubre nuestros espacios, disfruta de una propuesta gastronómica cuidada y deja que nos ocupemos de cada detalle.
      </p>
      <div class="hero-actions hero-fade" style="--d: 620ms">
        <RouterLink class="btn btn-gold" to="/espacios">Explorar espacios</RouterLink>
        <RouterLink class="btn btn-line" to="/reservar">Planear mi evento</RouterLink>
      </div>
    </div>
    <button class="media-toggle hero-toggle" type="button" @click="film?.toggle()">
      {{ film?.paused ? 'Reproducir video' : 'Pausar video' }}
    </button>
  </section>
</template>
