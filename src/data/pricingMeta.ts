import type { PriceOrigin } from '@/types/domain'

export const estimateNotice =
  'Presupuesto estimado sujeto a disponibilidad, confirmación de servicios y cotización final.'

/** No hay tratamiento fiscal publicado. null evita sumar un impuesto inventado. */
export const taxRate = null

/** No hay descuentos publicados. El arreglo vacío evita aplicar uno por defecto. */
export const configuredDiscounts: readonly { id: string; label: string; amountMxn: number }[] = []

export function originLabel(origin: PriceOrigin): string {
  if (origin === 'verified') return 'Tarifa vigente'
  if (origin === 'market_estimate') return 'Tarifa vigente'
  return 'Tarifa vigente'
}
