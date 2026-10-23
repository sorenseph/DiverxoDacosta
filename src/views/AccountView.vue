<script setup lang="ts">
import { usePageMeta } from '@/composables/usePageMeta'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

usePageMeta('Cuenta', 'Entra con tu usuario y contraseña.')

const ADMIN_KEY = 'diverxo-admin.session'
const STAFF_KEY = 'diverxo-staff.session'
const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
const role = ref<'admin' | 'staff' | ''>('')

function readRole() {
  if (sessionStorage.getItem(ADMIN_KEY)) role.value = 'admin'
  else if (sessionStorage.getItem(STAFF_KEY)) role.value = 'staff'
  else role.value = ''
}

async function login() {
  error.value = ''
  busy.value = true
  const staff = await fetch('/api/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', username: username.value, password: password.value }),
  })
  const staffBody = await staff.json() as { token?: string }
  if (staff.ok && staffBody.token) {
    sessionStorage.setItem(STAFF_KEY, staffBody.token)
    password.value = ''
    await router.push('/equipo')
    return
  }
  const admin = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', username: username.value, password: password.value }),
  })
  const adminBody = await admin.json() as { token?: string }
  busy.value = false
  password.value = ''
  if (admin.ok && adminBody.token) {
    sessionStorage.setItem(ADMIN_KEY, adminBody.token)
    await router.push('/admin')
    return
  }
  error.value = 'Usuario o contraseña incorrectos.'
}

function exit() {
  sessionStorage.removeItem(ADMIN_KEY)
  sessionStorage.removeItem(STAFF_KEY)
  role.value = ''
}

onMounted(readRole)
</script>

<template>
  <section class="section">
    <div class="container narrow">
      <p class="eyebrow">Cuenta</p>
      <h1 class="block-title">Entrar.</h1>
      <form v-if="!role" class="choice-grid" style="margin-top: 1.2rem" @submit.prevent="login">
        <p class="lede" style="grid-column: 1 / -1">Usa el usuario y la contraseña de la casa. El código por correo solo se usa al confirmar una reservación.</p>
        <div class="field">
          <label for="cuenta-usuario">Usuario</label>
          <input id="cuenta-usuario" v-model="username" type="text" autocomplete="username" required />
        </div>
        <div class="field">
          <label for="cuenta-clave">Contraseña</label>
          <input id="cuenta-clave" v-model="password" type="password" autocomplete="current-password" required />
        </div>
        <div class="actions" style="grid-column: 1 / -1">
          <button class="btn btn-dark" type="submit" :disabled="busy">Entrar</button>
        </div>
      </form>
      <div v-else style="margin-top: 1.2rem">
        <p class="lede">Ya tienes la sesión abierta.</p>
        <div class="actions" style="margin-top: 1rem">
          <RouterLink v-if="role === 'admin'" class="btn btn-dark" to="/admin">Ir a administración</RouterLink>
          <RouterLink v-else class="btn btn-dark" to="/equipo">Ver mis actividades</RouterLink>
          <button class="btn btn-line btn-line-dark" type="button" @click="exit">Cerrar sesión</button>
        </div>
      </div>
      <p v-if="error" class="field-error" role="alert" style="margin-top: 1rem">{{ error }}</p>
    </div>
  </section>
</template>
