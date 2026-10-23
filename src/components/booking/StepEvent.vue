<script setup lang="ts">
import { eventKindOptions } from '@/data/content'
import { useBookingStore } from '@/stores/booking'
import type { EventKind } from '@/types/domain'

const booking = useBookingStore()

function choose(id: EventKind) {
  booking.draft.eventKind = id
}
</script>

<template>
  <div>
    <h2 tabindex="-1">¿Qué quieres celebrar?</h2>
    <p class="lede" style="margin: 0.8rem 0 1.2rem">Elige el tipo de evento. Podrás precisarlo en los comentarios.</p>
    <div class="choice-grid" role="list">
      <button
        v-for="option in eventKindOptions"
        :key="option.id"
        type="button"
        class="choice"
        :aria-pressed="booking.draft.eventKind === option.id"
        @click="choose(option.id)"
      >
        <h3>{{ option.label }}</h3>
        <p>{{ option.description }}</p>
      </button>
    </div>
    <p v-if="booking.errors.eventKind" class="field-error" role="alert">{{ booking.errors.eventKind }}</p>
  </div>
</template>
