<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import { ref } from 'vue'

defineProps<{ items: readonly { question: string; answer: string }[] }>()
const openIndex = ref(0)

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? -1 : index
}
</script>

<template>
  <div>
    <div v-for="(item, index) in items" :key="item.question" class="faq-item">
      <h3>
        <button
          type="button"
          :aria-expanded="openIndex === index"
          :aria-controls="`faq-${index}`"
          @click="toggle(index)"
        >
          {{ item.question }}
          <ChevronDown :size="18" :style="{ transform: openIndex === index ? 'rotate(180deg)' : 'none' }" aria-hidden="true" />
        </button>
      </h3>
      <div class="faq-panel" :class="{ open: openIndex === index }" :id="`faq-${index}`">
        <div class="faq-panel-inner">
          <p class="fine">{{ item.answer }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
