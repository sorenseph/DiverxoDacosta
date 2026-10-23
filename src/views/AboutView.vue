<script setup lang="ts">
import AppImage from '@/components/ui/AppImage.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { aboutPrinciples } from '@/data/content'
import { media } from '@/data/media'

usePageMeta(
  'Nosotros',
  'DiverxoDacosta acompaña celebraciones con espacios, gastronomía y atención personalizada.',
)
</script>

<template>
  <section class="section">
    <div class="container split">
      <div>
        <p class="eyebrow">Nosotros</p>
        <h1 class="block-title">El arte de servir.</h1>
        <p style="margin-top: 1.2rem">
          Creemos que los mejores eventos no solo se organizan: se viven. Por eso buscamos que cada espacio, cada platillo y cada detalle formen parte de una experiencia coherente con lo que nuestros clientes desean celebrar.
        </p>
      </div>
      <AppImage :src="media.diningRoom" alt="Comedor con mesas vestidas frente a un ventanal." />
    </div>
  </section>
  <section class="section" style="padding-top: 0">
    <div class="container">
      <div class="process">
        <article v-for="item in aboutPrinciples" :key="item.title">
          <h2>{{ item.title }}</h2>
          <p>{{ item.text }}</p>
        </article>
      </div>
      <div class="cta-frame" style="margin-top: 3rem">
        <h2>Una conversación basta para empezar.</h2>
        <p class="lede">Cuéntanos la ocasión y armamos el espacio, la mesa y los tiempos.</p>
        <div class="actions">
          <RouterLink class="btn btn-dark" to="/reservar">Planear mi evento</RouterLink>
          <RouterLink class="btn btn-line btn-line-dark" to="/contacto">Escribirnos</RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>
