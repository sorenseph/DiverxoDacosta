<script setup lang="ts">
import { usePageMeta } from '@/composables/usePageMeta'
import { spaces } from '@/data/spaces'
import { formatLongDate } from '@/utils/money'
import { computed, onMounted, ref } from 'vue'

usePageMeta('Equipo', 'Consulta tus días, el espacio y la actividad asignada.')

interface Shift {
  id: string
  date: string
  spaceId: string
  activity: string
  startTime: string
  endTime: string
  notes: string
}

const TOKEN_KEY = 'diverxo-staff.session'
const token = ref('')
const displayName = ref('')
const error = ref('')
const shifts = ref<Shift[]>([])

const ordered = computed(() => [...shifts.value].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)))

function place(spaceId: string) {
  return spaces.find((item) => item.id === spaceId)?.name ?? spaceId
}

async function post(body: Record<string, unknown>, auth = false) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth) headers.Authorization = `Bearer ${token.value}`
  const response = await fetch('/api/staff', { method: 'POST', headers, body: JSON.stringify(body) })
  const payload = await response.json() as {
    ok?: boolean
    error?: string
    token?: string
    username?: string
    shifts?: Shift[]
  }
  return { response, payload }
}

async function load() {
  const { response, payload } = await post({ action: 'agenda' }, true)
  if (response.status === 401) {
    token.value = ''
    sessionStorage.removeItem(TOKEN_KEY)
    error.value = payload.error ?? 'Vuelve a entrar.'
    return
  }
  shifts.value = payload.shifts ?? []
  if (payload.username) displayName.value = payload.username
}

function exit() {
  token.value = ''
  displayName.value = ''
  shifts.value = []
  sessionStorage.removeItem(TOKEN_KEY)
}

onMounted(() => {
  const saved = sessionStorage.getItem(TOKEN_KEY)
  if (!saved) return
  token.value = saved
  void load()
})
</script>

<template>
  <section class="section">
    <div class="container narrow">
      <p class="eyebrow">Equipo</p>
      <h1 class="block-title">Tu actividad.</h1>
      <div v-if="!token" style="margin-top: 1.2rem">
        <p class="lede">Entra desde Cuenta con el usuario y la contraseña que te dio la casa.</p>
        <RouterLink class="btn btn-dark" to="/cuenta" style="margin-top: 1rem">Ir a entrar</RouterLink>
      </div>
      <template v-else>
        <div class="actions" style="margin: 1rem 0 1.4rem">
          <p>{{ displayName ? `Hola, ${displayName}.` : 'Estas son tus actividades.' }}</p>
          <button class="btn btn-line btn-line-dark" type="button" @click="exit">Cerrar sesión</button>
        </div>
        <p v-if="ordered.length === 0">Todavía no tienes actividades asignadas.</p>
        <div v-else class="reservation-list">
          <article v-for="item in ordered" :key="item.id" class="reservation-card">
            <p class="eyebrow">{{ formatLongDate(item.date) }}</p>
            <h2 style="font-size: 2rem">{{ item.activity }}</h2>
            <p>{{ place(item.spaceId) }}</p>
            <p>{{ item.startTime }} a {{ item.endTime }}</p>
            <p v-if="item.notes">{{ item.notes }}</p>
          </article>
        </div>
      </template>
      <p v-if="error" class="field-error" role="alert" style="margin-top: 1rem">{{ error }}</p>
    </div>
  </section>
</template>
