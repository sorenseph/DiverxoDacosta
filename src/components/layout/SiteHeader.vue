<script setup lang="ts">
import { navigation } from '@/data/site'
import { Menu, X } from '@lucide/vue'
import { onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const open = ref(false)
const closeButton = ref<HTMLButtonElement | null>(null)
const progress = ref(0)
const compact = ref(false)

function onScroll() {
  const scrolled = window.scrollY
  const height = document.documentElement.scrollHeight - window.innerHeight
  progress.value = height > 0 ? Math.min(1, scrolled / height) : 0
  compact.value = scrolled > 24
}

const links = [
  ...navigation,
  { to: '/reservaciones', label: 'Reservaciones' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

onScroll()
window.addEventListener('scroll', onScroll, { passive: true })

watch(open, (value) => {
  document.body.style.overflow = value ? 'hidden' : ''
  if (value) {
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => closeButton.value?.focus())
  } else {
    document.removeEventListener('keydown', onKey)
  }
})

watch(() => route.fullPath, () => {
  open.value = false
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <header class="site-header" :class="{ 'is-compact': compact }">
    <div class="scroll-progress" :style="{ transform: `scaleX(${progress})` }" aria-hidden="true"></div>
    <RouterLink class="brand" to="/" aria-label="DiverxoDacosta, inicio">
      <img src="/logoDiverxoDacosta.png" alt="DiverXo Dacosta" />
    </RouterLink>
    <nav class="desktop-nav" aria-label="Principal">
      <RouterLink v-for="link in links" :key="link.to" :to="link.to" :aria-current="isActive(link.to) ? 'page' : undefined">
        {{ link.label }}
      </RouterLink>
      <RouterLink class="btn btn-gold nav-cta" to="/reservar">Planear evento</RouterLink>
    </nav>
    <button class="nav-toggle" type="button" :aria-expanded="open" aria-controls="nav-movil" @click="open = true">
      <Menu :size="22" aria-hidden="true" />
      <span class="sr-only">Abrir menú</span>
    </button>
  </header>
  <nav v-if="open" id="nav-movil" class="mobile-nav" aria-label="Móvil">
    <header>
      <p class="eyebrow">Menú</p>
      <button ref="closeButton" class="nav-toggle" type="button" @click="open = false">
        <X :size="22" aria-hidden="true" />
        <span class="sr-only">Cerrar menú</span>
      </button>
    </header>
    <RouterLink v-for="link in links" :key="link.to" :to="link.to" :aria-current="isActive(link.to) ? 'page' : undefined">
      {{ link.label }}
    </RouterLink>
    <RouterLink class="btn btn-gold" to="/reservar">Planear mi evento</RouterLink>
  </nav>
</template>
