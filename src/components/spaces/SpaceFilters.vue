<script setup lang="ts">
import { spaceKindLabels } from '@/data/spaces'
import type { SpaceQuery } from '@/services/spacesService'
import type { SpaceKind } from '@/types/domain'

defineProps<{ query: SpaceQuery; note: string | null }>()
const emit = defineEmits<{ change: [query: SpaceQuery] }>()

const kinds: Array<{ value: SpaceKind | 'todos'; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'salon', label: spaceKindLabels.salon },
  { value: 'jardin', label: spaceKindLabels.jardin },
  { value: 'terraza', label: spaceKindLabels.terraza },
  { value: 'recinto', label: spaceKindLabels.recinto },
]

function update(query: SpaceQuery, patch: Partial<SpaceQuery>) {
  emit('change', { ...query, ...patch })
}

function numberOrNull(value: string): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
</script>

<template>
  <form class="filters" @submit.prevent>
    <div class="field">
      <label for="filtro-tipo">Tipo de espacio</label>
      <select id="filtro-tipo" :value="query.kind" @change="update(query, { kind: ($event.target as HTMLSelectElement).value as SpaceQuery['kind'] })">
        <option v-for="kind in kinds" :key="kind.value" :value="kind.value">{{ kind.label }}</option>
      </select>
    </div>
    <div class="field">
      <label for="filtro-invitados">Número de invitados</label>
      <input id="filtro-invitados" type="number" min="1" inputmode="numeric" :value="query.guests ?? ''" @input="update(query, { guests: numberOrNull(($event.target as HTMLInputElement).value) })" />
    </div>
    <div class="field">
      <label for="filtro-presupuesto">Presupuesto estimado</label>
      <input id="filtro-presupuesto" type="number" min="1" inputmode="numeric" placeholder="MXN" :value="query.budgetMxn ?? ''" @input="update(query, { budgetMxn: numberOrNull(($event.target as HTMLInputElement).value) })" />
    </div>
    <div class="field">
      <label for="filtro-fecha">Fecha del evento</label>
      <input id="filtro-fecha" type="date" :value="query.date" @input="update(query, { date: ($event.target as HTMLInputElement).value })" />
    </div>
    <div class="field">
      <label for="filtro-disponibilidad">Disponibilidad</label>
      <select id="filtro-disponibilidad" :value="query.availability" @change="update(query, { availability: ($event.target as HTMLSelectElement).value as SpaceQuery['availability'] })">
        <option value="todas">Todas</option>
        <option value="disponibles">Disponibles</option>
        <option value="ocupadas">Ocupadas</option>
      </select>
    </div>
    <div class="field">
      <label for="filtro-inicio">Hora de inicio</label>
      <input id="filtro-inicio" type="time" :value="query.startTime" @input="update(query, { startTime: ($event.target as HTMLInputElement).value })" />
    </div>
    <div class="field">
      <label for="filtro-fin">Hora de cierre</label>
      <input id="filtro-fin" type="time" :value="query.endTime" @input="update(query, { endTime: ($event.target as HTMLInputElement).value })" />
    </div>
    <p v-if="note" class="fine" style="grid-column: 1 / -1">{{ note }}</p>
  </form>
</template>
