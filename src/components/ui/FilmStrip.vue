<script setup lang="ts">
import AppImage from '@/components/ui/AppImage.vue'
import { onMounted, onUnmounted, ref } from 'vue'

defineProps<{
  items: readonly { src: string; alt: string; caption: string }[]
  label: string
}>()

const viewport = ref<HTMLElement | null>(null)
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const paused = ref(reduce)
let frame = 0
let dragging = false
let startX = 0
let startScroll = 0

function normalize() {
  const element = viewport.value
  if (!element) return
  const half = element.scrollWidth / 2
  if (half <= 0) return
  if (element.scrollLeft >= half) element.scrollLeft -= half
  if (element.scrollLeft < 0) element.scrollLeft += half
}

function tick() {
  const element = viewport.value
  if (element && !paused.value && !dragging) {
    element.scrollLeft += 0.55
    normalize()
  }
  frame = requestAnimationFrame(tick)
}

function onDown(event: PointerEvent) {
  const element = viewport.value
  if (!element) return
  dragging = true
  element.classList.add('is-dragging')
  element.setPointerCapture(event.pointerId)
  startX = event.clientX
  startScroll = element.scrollLeft
}

function onMove(event: PointerEvent) {
  const element = viewport.value
  if (!dragging || !element) return
  element.scrollLeft = startScroll - (event.clientX - startX)
  normalize()
}

function onUp() {
  dragging = false
  viewport.value?.classList.remove('is-dragging')
}

onMounted(() => {
  frame = requestAnimationFrame(tick)
})

onUnmounted(() => cancelAnimationFrame(frame))
</script>

<template>
  <div class="filmstrip">
    <div class="filmstrip-bar">
      <p class="fine">Desliza la galería o déjala correr.</p>
      <button class="btn btn-line btn-line-dark" type="button" @click="paused = !paused">
        {{ paused ? 'Reproducir galería' : 'Pausar galería' }}
      </button>
    </div>
    <div
      ref="viewport"
      class="filmstrip-viewport"
      role="region"
      :aria-label="label"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    >
      <div class="filmstrip-track">
        <figure v-for="item in items" :key="item.src">
          <div class="zoom">
            <AppImage :src="item.src" :alt="item.alt" />
          </div>
          <figcaption>{{ item.caption }}</figcaption>
        </figure>
        <figure v-for="item in items" :key="`${item.src}-copia`" aria-hidden="true">
          <div class="zoom">
            <AppImage :src="item.src" alt="" />
          </div>
          <figcaption>{{ item.caption }}</figcaption>
        </figure>
      </div>
    </div>
  </div>
</template>
