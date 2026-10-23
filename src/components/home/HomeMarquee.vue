<script setup lang="ts">
const words = ['Bodas', 'Banquetes', 'Jardines', 'Coffee break', 'XV años', 'Empresas', 'Terrazas', 'Celebraciones privadas']
</script>

<template>
  <div class="marquee" aria-hidden="true">
    <div class="marquee-track">
      <p v-for="copy in 2" :key="copy">
        <span v-for="word in words" :key="`${copy}-${word}`">{{ word }}</span>
      </p>
    </div>
  </div>
</template>
