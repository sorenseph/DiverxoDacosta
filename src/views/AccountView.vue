<script setup lang="ts">
import { usePageMeta } from '@/composables/usePageMeta'
import { currentUser, ensureAccount, signIn, signOut } from '@/services/account'
import { sendMail } from '@/services/mailClient'
import { onMounted, ref } from 'vue'

usePageMeta('Cuenta', 'Entra o crea tu cuenta para guardar reservaciones y recibir la cotización por correo.')

const email = ref('')
const password = ref('')
const name = ref('')
const mode = ref<'entrar' | 'crear'>('crear')
const sessionEmail = ref('')
const message = ref('')
const error = ref('')

async function refresh() {
  const user = await currentUser()
  sessionEmail.value = user?.email ?? ''
}

async function submit() {
  error.value = ''
  message.value = ''
  if (mode.value === 'entrar') {
    error.value = await signIn(email.value, password.value) ?? ''
    if (!error.value) message.value = 'Sesión iniciada.'
  } else {
    const account = await ensureAccount(email.value, password.value, name.value || email.value)
    if (!account.ok) {
      error.value = account.message
      return
    }
    const mailed = await sendMail({ kind: 'registro', to: email.value.trim(), name: name.value.trim() || email.value.trim() })
    message.value = mailed
      ? 'La cuenta quedó registrada. El correo de bienvenida no pudo enviarse todavía.'
      : 'La cuenta quedó registrada. Revisa tu correo.'
  }
  await refresh()
}

async function exit() {
  await signOut()
  sessionEmail.value = ''
  message.value = 'Cerraste la sesión.'
}

onMounted(refresh)
</script>

<template>
  <section class="section">
    <div class="container narrow">
      <p class="eyebrow">Cuenta</p>
      <h1 class="block-title">Tu cuenta.</h1>
      <p v-if="sessionEmail" class="lede" style="margin: 1rem 0">Sesión de {{ sessionEmail }}.</p>
      <p v-else class="lede" style="margin: 1rem 0">Crea una cuenta para guardar reservaciones y recibir la cotización por correo.</p>
      <form class="choice-grid" @submit.prevent="submit">
        <div v-if="mode === 'crear'" class="field">
          <label for="cuenta-nombre">Nombre</label>
          <input id="cuenta-nombre" v-model="name" type="text" autocomplete="name" />
        </div>
        <div class="field">
          <label for="cuenta-correo">Correo</label>
          <input id="cuenta-correo" v-model="email" type="email" autocomplete="email" required />
        </div>
        <div class="field">
          <label for="cuenta-clave">Contraseña</label>
          <input id="cuenta-clave" v-model="password" type="password" autocomplete="current-password" minlength="6" required />
        </div>
        <div class="actions" style="grid-column: 1 / -1">
          <button class="btn btn-dark" type="submit">{{ mode === 'crear' ? 'Crear cuenta' : 'Entrar' }}</button>
          <button class="btn btn-line btn-line-dark" type="button" @click="mode = mode === 'crear' ? 'entrar' : 'crear'">
            {{ mode === 'crear' ? 'Ya tengo cuenta' : 'Crear una cuenta' }}
          </button>
          <button v-if="sessionEmail" class="btn btn-line btn-line-dark" type="button" @click="exit">Cerrar sesión</button>
        </div>
      </form>
      <p v-if="error" class="field-error" role="alert" style="margin-top: 1rem">{{ error }}</p>
      <p v-if="message" class="demo-callout" role="status" style="margin-top: 1rem">{{ message }}</p>
    </div>
  </section>
</template>
