<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

withDefaults(defineProps<{
  src: string
  poster: string
  label: string
  showControl?: boolean
}>(), {
  showControl: true,
})

const video = ref<HTMLVideoElement | null>(null)
const paused = ref(false)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const showVideo = ref(!reduceMotion)
let observer: IntersectionObserver | null = null

function play() {
  const element = video.value
  if (!element) return
  void element.play().catch(() => {
    paused.value = true
  })
}

function pause() {
  video.value?.pause()
}

function toggle() {
  if (video.value?.paused) play()
  else pause()
}

onMounted(() => {
  const element = video.value
  if (!element) return
  observer = new IntersectionObserver(([entry]) => {
    if (!entry) return
    if (entry.isIntersecting) play()
    else pause()
  }, { threshold: 0.25 })
  observer.observe(element)
})

onUnmounted(() => observer?.disconnect())

defineExpose({ toggle, paused })
</script>

<template>
  <span class="media-slot">
    <video
      v-if="showVideo"
      ref="video"
      class="ambient"
      :poster="poster"
      muted
      loop
      playsinline
      preload="none"
      :aria-label="label"
      @play="paused = false"
      @pause="paused = true"
    >
      <source :src="src" type="video/mp4" />
    </video>
    <img v-else class="ambient" :src="poster" :alt="label" />
    <button v-if="showVideo && showControl !== false" class="media-toggle" type="button" @click="toggle">
      {{ paused ? 'Reproducir video' : 'Pausar video' }}
    </button>
  </span>
</template>
