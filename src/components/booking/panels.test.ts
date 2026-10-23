import ConfirmationPanel from '@/components/booking/ConfirmationPanel.vue'
import PriceBreakdown from '@/components/booking/PriceBreakdown.vue'
import type { PriceQuote } from '@/types/domain'
import { formatMxn } from '@/utils/money'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

const quote: PriceQuote = {
  lines: [{ id: 'space', label: 'Renta de Salón', detail: '6 h incluidas · precio por evento', amountMxn: 68000 }],
  totalMxn: 68000,
}

describe('pantallas de reservación', () => {
  it('muestra la confirmación y el folio', () => {
    const wrapper = mount(ConfirmationPanel, {
      props: {
        folio: 'DX-20261120-TEST',
        eventLabel: 'Boda',
        dateLabel: 'viernes, 20 de noviembre de 2026',
        schedule: '16:00 a 22:00 · 6 horas',
        spaceName: 'Salón',
        guests: 80,
        services: ['Banquete formal'],
        quote,
      },
    })
    expect(wrapper.text()).toContain('Tu próximo gran momento comienza aquí.')
    expect(wrapper.text()).toContain('Recibimos tu solicitud.')
    expect(wrapper.text()).toContain('DX-20261120-TEST')
    expect(wrapper.text()).toContain('Salón')
  })

  it('muestra el desglose y el total en pesos', () => {
    const wrapper = mount(PriceBreakdown, { props: { quote } })
    expect(wrapper.text()).toContain('Renta de Salón')
    expect(wrapper.text()).toContain('Total estimado')
    expect(wrapper.text()).toContain(formatMxn(68000))
  })
})
