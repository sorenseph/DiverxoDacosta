<script setup lang="ts">
import PackageCard from '@/components/catering/PackageCard.vue'
import AmbientVideo from '@/components/ui/AmbientVideo.vue'
import FilmStrip from '@/components/ui/FilmStrip.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { cateringPackages, culinaryOfferings } from '@/data/catering'
import { films, media } from '@/data/media'

usePageMeta(
  'Catering y banquetes',
  'Banquetes, taquiza, comida corporativa y coffee break para bodas, eventos sociales y encuentros de empresa.',
)
</script>

<template>
  <section class="section">
    <div class="container split">
      <div>
        <p class="eyebrow">Catering y banquetes</p>
        <h1 class="block-title">Una experiencia memorable también se disfruta en la mesa.</h1>
        <p style="margin-top: 1rem">
          Diseñamos propuestas gastronómicas que acompañan el estilo de cada celebración. Desde reuniones íntimas hasta grandes eventos, cuidamos la presentación, el servicio y los detalles para que cada momento se disfrute sin preocupaciones.
        </p>
      </div>
      <AmbientVideo :src="films.chef.src" :poster="films.chef.poster" :label="films.chef.label" />
    </div>
  </section>
  <section class="section" style="padding-top: 0">
    <div class="container offer-grid">
      <article v-for="offer in culinaryOfferings" :key="offer.id" class="offer-card">
        <h2 style="font-size: 2rem">{{ offer.title }}</h2>
        <p style="margin-top: 0.6rem">{{ offer.text }}</p>
      </article>
    </div>
  </section>
  <section class="section" style="padding-top: 0">
    <div class="container">
      <div class="section-head">
        <h2>Paquetes</h2>
        <p class="lede">Elige un punto de partida. El menú se ajusta al evento y el total cambia con el número de invitados.</p>
      </div>
      <div class="package-grid">
        <PackageCard v-for="item in cateringPackages" :key="item.id" :item="item" />
      </div>
    </div>
  </section>
  <section class="section" style="padding-top: 0">
    <FilmStrip
      :items="[
        { src: media.buffet, alt: 'Mesa de servicio con charolas, flores blancas y bocados.', caption: 'Servicio' },
        { src: media.brunch, alt: 'Mesa de desayuno compartido.', caption: 'De día' },
        { src: media.cocktail, alt: 'Cóctel servido en una barra.', caption: 'Barra' },
        { src: media.plate, alt: 'Plato de cocina de autor servido en una mesa con copas de vino.', caption: 'Cocina' },
      ]"
      label="Galería de catering y banquetes"
    />
  </section>
</template>
