<script setup lang="ts">
import { estimateNotice } from '@/data/pricingMeta'
import type { PriceQuote } from '@/types/domain'
import { formatMxn } from '@/utils/money'

withDefaults(defineProps<{ quote: PriceQuote; notice?: boolean }>(), { notice: true })
</script>

<template>
  <table class="price-table">
    <caption class="sr-only">Desglose estimado en pesos mexicanos</caption>
    <tbody>
      <tr v-for="line in quote.lines" :key="line.id">
        <th scope="row">
          {{ line.label }}
          <span>{{ line.detail }}</span>
        </th>
        <td>{{ formatMxn(line.amountMxn) }}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <th scope="row">Total estimado</th>
        <td>{{ formatMxn(quote.totalMxn) }}</td>
      </tr>
    </tfoot>
  </table>
  <p v-if="notice" class="fine" style="margin-top: 0.8rem">{{ estimateNotice }}</p>
</template>
