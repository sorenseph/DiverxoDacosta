<script setup lang="ts">
import { processSteps } from '@/data/content'
</script>

<template>
  <section class="section">
    <div class="container">
      <div class="section-head">
        <h2>Cómo trabajamos</h2>
        <p class="lede">Un recorrido claro, de la primera conversación al día de la celebración.</p>
      </div>
      <div class="process">
        <article v-for="step in processSteps" :key="step.number">
          <span>{{ step.number }}</span>
          <h3>{{ step.title }}</h3>
          <p>{{ step.text }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
