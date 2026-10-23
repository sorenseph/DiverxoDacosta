<script setup lang="ts">
import AppImage from '@/components/ui/AppImage.vue'
import FilmStrip from '@/components/ui/FilmStrip.vue'
import { galleryItems } from '@/data/content'
</script>

<template>
  <section class="section" style="padding-top: 0">
    <div class="container">
      <div class="section-head">
        <h2>La mesa y el lugar</h2>
        <p class="lede">Banquete, jardín, montaje y terraza: el tono con el que recibimos una celebración.</p>
      </div>
    </div>
    <FilmStrip :items="galleryItems" label="Galería de banquetes, jardín y terraza" />
    <div class="container" style="margin-top: 1rem">
      <div class="gallery-grid">
        <figure v-for="item in galleryItems" :key="item.src" class="parallax">
          <div class="zoom">
            <AppImage :src="item.src" :alt="item.alt" />
          </div>
          <figcaption>{{ item.caption }}</figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>
