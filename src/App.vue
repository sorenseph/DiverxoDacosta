<script setup lang="ts">
import SiteFooter from '@/components/layout/SiteFooter.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import { useScrollMotion } from '@/composables/useScrollMotion'
import { useDemoStore } from '@/stores/demo'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const main = ref<HTMLElement | null>(null)
const { refresh } = useScrollMotion(main)
const demo = useDemoStore()
const route = useRoute()
const isAdmin = computed(() => route.name === 'admin')

onMounted(() => {
  refresh()
  void demo.hydrateFromCloud()
})
</script>

<template>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  <SiteHeader v-if="!isAdmin" />
  <main id="contenido" ref="main" tabindex="-1" :class="{ 'is-admin': isAdmin }">
    <RouterView v-slot="{ Component, route }">
      <Transition name="page" mode="out-in" @after-enter="refresh">
        <div :key="route.path" class="page-shell">
          <component :is="Component" />
        </div>
      </Transition>
    </RouterView>
  </main>
  <SiteFooter v-if="!isAdmin" />
</template>
