<script setup lang="ts">
import { useBookingStore } from '@/stores/booking'

const booking = useBookingStore()
</script>

<template>
  <div>
    <h2 tabindex="-1">Datos de contacto</h2>
    <p class="lede" style="margin: 0.8rem 0 1.2rem">Déjanos tus datos. Al final te enviamos un código de 6 dígitos para confirmar, sin crear una contraseña.</p>
    <div class="choice-grid">
      <div class="field">
        <label for="nombre">Nombre completo</label>
        <input id="nombre" v-model="booking.draft.client.fullName" type="text" autocomplete="name" :aria-invalid="Boolean(booking.errors.fullName)" :aria-describedby="booking.errors.fullName ? 'nombre-error' : undefined" />
        <p v-if="booking.errors.fullName" id="nombre-error" class="field-error" role="alert">{{ booking.errors.fullName }}</p>
      </div>
      <div class="field">
        <label for="correo">Correo electrónico</label>
        <input id="correo" v-model="booking.draft.client.email" type="email" autocomplete="email" :aria-invalid="Boolean(booking.errors.email)" :aria-describedby="booking.errors.email ? 'correo-error' : undefined" />
        <p v-if="booking.errors.email" id="correo-error" class="field-error" role="alert">{{ booking.errors.email }}</p>
      </div>
      <div class="field">
        <label for="telefono">Teléfono</label>
        <input id="telefono" v-model="booking.draft.client.phone" type="tel" autocomplete="tel" inputmode="tel" :aria-invalid="Boolean(booking.errors.phone)" :aria-describedby="booking.errors.phone ? 'telefono-error' : undefined" />
        <p v-if="booking.errors.phone" id="telefono-error" class="field-error" role="alert">{{ booking.errors.phone }}</p>
      </div>
      <fieldset class="field" style="grid-column: 1 / -1">
        <legend>¿Dónde recibes el código?</legend>
        <div class="channel-picks">
          <label><input v-model="booking.channel" type="radio" value="email" /> Correo electrónico</label>
          <label><input v-model="booking.channel" type="radio" value="phone" /> Teléfono</label>
        </div>
      </fieldset>
      <div class="field" style="grid-column: 1 / -1">
        <label for="notas">Comentarios o necesidades especiales</label>
        <textarea id="notas" v-model="booking.draft.client.notes" />
      </div>
    </div>
  </div>
</template>
