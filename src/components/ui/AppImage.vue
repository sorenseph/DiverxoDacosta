<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ src: string; alt: string; eager?: boolean }>()
const failed = ref(false)
</script>

<template>
  <img
    v-if="!failed"
    :src="src"
    :alt="alt"
    :loading="eager ? 'eager' : 'lazy'"
    decoding="async"
    @error="failed = true"
  />
  <div v-else class="image-fallback" role="img" :aria-label="alt">
    <span>{{ alt }}</span>
  </div>
</template>
