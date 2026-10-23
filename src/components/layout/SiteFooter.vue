<script setup lang="ts">
import { siteContact } from '@/data/site'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <img class="footer-logo" src="/logoDiverxoDacosta.png" alt="DiverXo Dacosta" />
        <p>El arte de servir. Espacios, mesa y atención para celebraciones que quieren sentirse cuidadas.</p>
      </div>
      <div>
        <p class="eyebrow">Explorar</p>
        <ul>
          <li><RouterLink to="/espacios">Espacios</RouterLink></li>
          <li><RouterLink to="/catering">Catering</RouterLink></li>
          <li><RouterLink to="/nosotros">Nosotros</RouterLink></li>
          <li><RouterLink to="/contacto">Contacto</RouterLink></li>
        </ul>
      </div>
      <div>
        <p class="eyebrow">Tu evento</p>
        <ul>
          <li><RouterLink to="/reservar">Planear mi evento</RouterLink></li>
          <li><RouterLink to="/reservaciones">Reservaciones</RouterLink></li>
          <li><RouterLink to="/contacto">Pedir información</RouterLink></li>
        </ul>
      </div>
      <div>
        <p class="eyebrow">Contacto</p>
        <ul>
          <li><a :href="`mailto:${siteContact.email}`">{{ siteContact.email }}</a></li>
          <li><a :href="siteContact.phoneHref">{{ siteContact.phoneDisplay }}</a></li>
          <li>{{ siteContact.address }}</li>
          <li>{{ siteContact.hours }}</li>
        </ul>
      </div>
    </div>
    <div class="container footer-base">
      <p>© {{ year }} DiverxoDacosta.</p>
      <p>Catering, banquetes y espacios para eventos.</p>
    </div>
  </footer>
</template>
