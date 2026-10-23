<script setup lang="ts">
import SiteFooter from '@/components/layout/SiteFooter.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import { useScrollMotion } from '@/composables/useScrollMotion'
import { useDemoStore } from '@/stores/demo'
import { onMounted, ref } from 'vue'

const main = ref<HTMLElement | null>(null)
const { refresh } = useScrollMotion(main)
const demo = useDemoStore()

onMounted(() => {
  refresh()
  void demo.hydrateFromCloud()
})
</script>

<template>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  <SiteHeader />
  <main id="contenido" ref="main" tabindex="-1">
    <RouterView v-slot="{ Component, route }">
      <Transition name="page" mode="out-in" @after-enter="refresh">
        <div :key="route.path" class="page-shell">
          <component :is="Component" />
        </div>
      </Transition>
    </RouterView>
  </main>
  <SiteFooter />
</template>
