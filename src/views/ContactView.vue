<script setup lang="ts">
import QuoteForm from '@/components/forms/QuoteForm.vue'
import FaqList from '@/components/ui/FaqList.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { faqs } from '@/data/content'
import { siteContact } from '@/data/site'
import { useDemoStore } from '@/stores/demo'
import { formatLongDate } from '@/utils/money'

usePageMeta(
  'Contacto y cotizaciones',
  'Cuéntanos la fecha, el número de invitados y el tipo de celebración. Te respondemos para afinar la propuesta.',
)

const demo = useDemoStore()
</script>

<template>
  <section class="section">
    <div class="container split">
      <div>
        <p class="eyebrow">Contacto</p>
        <h1 class="block-title">Cuéntanos la ocasión.</h1>
        <p style="margin: 1rem 0 1.4rem">
          Escríbenos la fecha, el número de invitados y lo que quieres que se sienta en la mesa.
        </p>
        <div class="demo-callout">
          <p><a :href="`mailto:${siteContact.email}`">{{ siteContact.email }}</a></p>
          <p><a :href="siteContact.phoneHref">{{ siteContact.phoneDisplay }}</a></p>
          <p>{{ siteContact.address }}</p>
          <p>{{ siteContact.hours }}</p>
        </div>
      </div>
      <QuoteForm />
    </div>
  </section>
  <section class="section" style="padding-top: 0">
    <div class="container">
      <h2>Solicitudes enviadas</h2>
      <div v-if="demo.quotes.length === 0" class="empty-state" style="margin-top: 1rem">
        <p>Todavía no hay solicitudes.</p>
      </div>
      <div v-else class="reservation-list" style="margin-top: 1rem">
        <article v-for="quote in demo.quotes" :key="quote.id" class="reservation-card">
          <header>
            <h3>{{ quote.name }}</h3>
            <span class="badge">{{ formatLongDate(quote.createdAt.slice(0, 10)) }}</span>
          </header>
          <p>{{ quote.message }}</p>
          <p class="fine">{{ quote.email }}<span v-if="quote.tentativeDate"> · fecha tentativa {{ formatLongDate(quote.tentativeDate) }}</span></p>
        </article>
      </div>
    </div>
  </section>
  <section class="section" style="padding-top: 0">
    <div class="container narrow">
      <h2 style="margin-bottom: 1rem">Preguntas frecuentes</h2>
      <FaqList :items="faqs.slice(0, 4)" />
    </div>
  </section>
</template>
