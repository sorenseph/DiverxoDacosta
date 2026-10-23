<script setup lang="ts">
import AmbientVideo from '@/components/ui/AmbientVideo.vue'
import { films } from '@/data/media'

const reels = [
  { film: films.chef, text: 'La preparación, antes de que la mesa se siente.' },
  { film: films.kitchen, text: 'El servicio ocurre fuera de la vista de los invitados.' },
]
</script>

<template>
  <section class="section" style="padding-top: 0">
    <div class="container">
      <div class="section-head">
        <div>
          <p class="eyebrow">En movimiento</p>
          <h2>El servicio también se ve.</h2>
        </div>
        <p class="lede">La cocina, el emplatado y el ritmo de una mesa bien llevada.</p>
      </div>
      <div class="reel-grid">
        <article v-for="reel in reels" :key="reel.film.src" class="reel-card">
          <AmbientVideo :src="reel.film.src" :poster="reel.film.poster" :label="reel.film.label" />
          <p>{{ reel.text }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
