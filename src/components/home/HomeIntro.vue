<script setup lang="ts">
import AppImage from '@/components/ui/AppImage.vue'
import { media } from '@/data/media'
</script>

<template>
  <section class="section">
    <div class="container split">
      <div>
        <p class="eyebrow">La casa</p>
        <h2 class="block-title">De la primera idea al último detalle.</h2>
      </div>
      <div>
        <p>
          Cada celebración tiene una historia. Nuestro trabajo es ayudarte a convertirla en una experiencia memorable. En DiverxoDacosta reunimos espacios, gastronomía y atención personalizada para acompañarte desde la primera idea hasta el último detalle de tu evento.
        </p>
        <div class="principles">
          <article>
            <strong>01</strong>
            <p>Un lugar con el carácter de la ocasión, no un salón intercambiable.</p>
          </article>
          <article>
            <strong>02</strong>
            <p>Una mesa cuidada, con servicio que acompaña y no interrumpe.</p>
          </article>
          <article>
            <strong>03</strong>
            <p>Alguien pendiente de los detalles para que tú estés con tus invitados.</p>
          </article>
        </div>
      </div>
    </div>
    <div class="container intro-photo">
      <div class="parallax">
        <div class="zoom">
          <AppImage :src="media.tent" alt="Mesa de banquete bajo una carpa blanca, con copas, velas y flores." />
        </div>
      </div>
    </div>
  </section>
</template>
