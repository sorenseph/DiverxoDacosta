<script setup lang="ts">
import { eventKindOptions } from '@/data/content'
import type { FieldErrors } from '@/services/bookingValidation'
import { useDemoStore } from '@/stores/demo'
import { addDays, todayInMexico } from '@/utils/time'
import { reactive, ref } from 'vue'

const demo = useDemoStore()
const minDate = addDays(todayInMexico(), 1)
const errors = ref<FieldErrors>({})
const sent = ref(false)
const form = reactive({
  name: '',
  email: '',
  phone: '',
  eventKind: '',
  tentativeDate: '',
  guestsText: '',
  message: '',
})

const mailNotice = ref('')

async function submit() {
  sent.value = false
  mailNotice.value = ''
  const guests = form.guestsText.trim() === '' ? null : Number(form.guestsText)
  const result = await demo.submitQuote({
    name: form.name,
    email: form.email,
    phone: form.phone,
    eventKind: form.eventKind,
    tentativeDate: form.tentativeDate,
    guests,
    message: form.message,
  })
  if (!result.ok) {
    errors.value = result.errors
    return
  }
  errors.value = {}
  sent.value = true
  mailNotice.value = result.notice ?? ''
  form.name = ''
  form.email = ''
  form.phone = ''
  form.eventKind = ''
  form.tentativeDate = ''
  form.guestsText = ''
  form.message = ''
}
</script>

<template>
  <form class="panel" @submit.prevent="submit">
    <div class="choice-grid">
      <div class="field">
        <label for="cotiza-nombre">Nombre</label>
        <input id="cotiza-nombre" v-model="form.name" type="text" autocomplete="name" :aria-invalid="Boolean(errors.name)" :aria-describedby="errors.name ? 'cotiza-nombre-error' : undefined" />
        <p v-if="errors.name" id="cotiza-nombre-error" class="field-error" role="alert">{{ errors.name }}</p>
      </div>
      <div class="field">
        <label for="cotiza-correo">Correo electrónico</label>
        <input id="cotiza-correo" v-model="form.email" type="email" autocomplete="email" :aria-invalid="Boolean(errors.email)" :aria-describedby="errors.email ? 'cotiza-correo-error' : undefined" />
        <p v-if="errors.email" id="cotiza-correo-error" class="field-error" role="alert">{{ errors.email }}</p>
      </div>
      <div class="field">
        <label for="cotiza-telefono">Teléfono (opcional)</label>
        <input id="cotiza-telefono" v-model="form.phone" type="tel" autocomplete="tel" :aria-invalid="Boolean(errors.phone)" :aria-describedby="errors.phone ? 'cotiza-telefono-error' : undefined" />
        <p v-if="errors.phone" id="cotiza-telefono-error" class="field-error" role="alert">{{ errors.phone }}</p>
      </div>
      <div class="field">
        <label for="cotiza-tipo">Tipo de evento</label>
        <select id="cotiza-tipo" v-model="form.eventKind">
          <option value="">Selecciona una opción</option>
          <option v-for="option in eventKindOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
        </select>
      </div>
      <div class="field">
        <label for="cotiza-fecha">Fecha tentativa</label>
        <input id="cotiza-fecha" v-model="form.tentativeDate" type="date" :min="minDate" :aria-invalid="Boolean(errors.tentativeDate)" :aria-describedby="errors.tentativeDate ? 'cotiza-fecha-error' : undefined" />
        <p v-if="errors.tentativeDate" id="cotiza-fecha-error" class="field-error" role="alert">{{ errors.tentativeDate }}</p>
      </div>
      <div class="field">
        <label for="cotiza-invitados">Número de invitados</label>
        <input id="cotiza-invitados" v-model="form.guestsText" type="number" min="1" inputmode="numeric" :aria-invalid="Boolean(errors.guests)" :aria-describedby="errors.guests ? 'cotiza-invitados-error' : undefined" />
        <p v-if="errors.guests" id="cotiza-invitados-error" class="field-error" role="alert">{{ errors.guests }}</p>
      </div>
      <div class="field" style="grid-column: 1 / -1">
        <label for="cotiza-mensaje">Mensaje</label>
        <textarea id="cotiza-mensaje" v-model="form.message" :aria-invalid="Boolean(errors.message)" :aria-describedby="errors.message ? 'cotiza-mensaje-error' : undefined" />
        <p v-if="errors.message" id="cotiza-mensaje-error" class="field-error" role="alert">{{ errors.message }}</p>
      </div>
    </div>
    <button class="btn btn-dark" type="submit" style="margin-top: 1rem">Enviar solicitud</button>
    <p v-if="sent" class="demo-callout" style="margin-top: 1rem" role="status">
      Recibimos tu solicitud. Te enviamos un correo con la confirmación y te contactamos para afinar el evento.
      <span v-if="mailNotice"> {{ mailNotice }}</span>
    </p>
  </form>
</template>
