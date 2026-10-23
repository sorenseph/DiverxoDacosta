<script setup lang="ts">
import { usePageMeta } from '@/composables/usePageMeta'

usePageMeta('Página no encontrada', 'La ruta solicitada no existe en DiverxoDacosta.')
</script>

<template>
  <section class="section">
    <div class="container empty-state">
      <p class="eyebrow">404</p>
      <h1 class="block-title">Esta página no está en la casa.</h1>
      <p>El enlace no corresponde a ninguna sección. Puedes volver al inicio o ver los espacios.</p>
      <div class="actions" style="margin-top: 1rem">
        <RouterLink class="btn btn-dark" to="/">Ir al inicio</RouterLink>
        <RouterLink class="btn btn-line btn-line-dark" to="/espacios">Ver espacios</RouterLink>
      </div>
    </div>
  </section>
</template>
