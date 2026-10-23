import type { AddonService } from '@/types/domain'

/**
 * Conceptos que se pueden sumar a la renta.
 * No incluir aquí un servicio que la renta o el paquete ya cubra.
 */
export const additionalServices: AddonService[] = [
  {
    id: 'waiters',
    name: 'Servicio de meseros',
    description: 'Un mesero por cada 12 invitados, cobrado por persona de servicio y por turno.',
    pricing: 'per_unit',
    amountMxn: 480,
    origin: 'verified',
    guestsPerUnit: 12,
  },
  {
    id: 'furniture',
    name: 'Mobiliario y mantelería',
    description: 'Mesas, sillas y mantelería básica cuando el espacio no las incluye en la renta.',
    pricing: 'per_guest',
    amountMxn: 90,
    origin: 'verified',
  },
]

export function serviceById(id: string): AddonService | undefined {
  return additionalServices.find((item) => item.id === id)
}
