<script setup lang="ts">
import HomeCta from '@/components/home/HomeCta.vue'
import HomeCulinary from '@/components/home/HomeCulinary.vue'
import HomeGallery from '@/components/home/HomeGallery.vue'
import HomeHero from '@/components/home/HomeHero.vue'
import HomeIntro from '@/components/home/HomeIntro.vue'
import HomeMarquee from '@/components/home/HomeMarquee.vue'
import HomeProcess from '@/components/home/HomeProcess.vue'
import HomeReels from '@/components/home/HomeReels.vue'
import HomeServices from '@/components/home/HomeServices.vue'
import HomeSpaces from '@/components/home/HomeSpaces.vue'
import FaqList from '@/components/ui/FaqList.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { faqs } from '@/data/content'

usePageMeta(
  'Catering, banquetes y espacios para eventos',
  'DiverxoDacosta reúne catering, banquetes y renta de espacios para bodas, celebraciones y eventos de empresa.',
)
</script>

<template>
  <HomeHero />
  <HomeMarquee />
  <HomeIntro />
  <HomeServices />
  <HomeSpaces />
  <HomeCulinary />
  <HomeProcess />
  <HomeReels />
  <HomeGallery />
  <HomeCta />
  <section class="section" style="padding-top: 0">
    <div class="container narrow">
      <p class="eyebrow">Preguntas</p>
      <h2 class="block-title" style="margin-bottom: 1.5rem">Preguntas frecuentes</h2>
      <FaqList :items="faqs" />
    </div>
  </section>
</template>
