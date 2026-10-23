<script setup lang="ts">
import { homeServices } from '@/data/content'
import { ArrowRight } from '@lucide/vue'
</script>

<template>
  <section class="section" style="padding-top: 0">
    <div class="container">
      <div class="section-head">
        <h2>Lo que podemos acompañar</h2>
        <p class="lede">Cuatro maneras de empezar. El detalle se arma contigo, no con un paquete genérico.</p>
      </div>
      <div class="service-list">
        <RouterLink v-for="service in homeServices" :key="service.number" :to="service.to">
          <span>{{ service.number }}</span>
          <h3>{{ service.title }}</h3>
          <p>{{ service.text }}</p>
          <ArrowRight :size="18" aria-hidden="true" />
        </RouterLink>
      </div>
    </div>
  </section>
</template>
