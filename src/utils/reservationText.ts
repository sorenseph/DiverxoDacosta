import { serviceById } from '@/data/additionalServices'
import { cateringPackages } from '@/data/cateringPackages'
import { eventKindLabels } from '@/data/content'
import { getSpaceById } from '@/services/spacesService'
import type { Reservation, ReservationStatus } from '@/types/domain'

export const statusLabels: Record<ReservationStatus, string> = {
  pendiente: 'Pendiente de revisión',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
}

export function reservationServices(reservation: Reservation): string[] {
  const labels: string[] = []
  const selected = cateringPackages.find((item) => item.id === reservation.addons.cateringPackageId)
  if (selected) labels.push(selected.name)
  else if (reservation.addons.cateringPackageId) labels.push('Paquete registrado en la reservación')
  if (reservation.addons.waiters) labels.push('Servicio de meseros')
  if (reservation.addons.furniture) labels.push('Mobiliario y mantelería')
  if (reservation.addons.decoration) labels.push('Decoración registrada en la reservación')
  for (const extraId of reservation.addons.extraIds) {
    const extra = serviceById(extraId)
    if (extra) labels.push(extra.name)
    else labels.push('Servicio registrado en la reservación')
  }
  return labels.length > 0 ? labels : ['Sin servicios adicionales']
}

export function reservationSpaceName(reservation: Reservation): string {
  return getSpaceById(reservation.spaceId)?.name ?? 'Espacio'
}

export function reservationEventLabel(reservation: Reservation): string {
  return eventKindLabels[reservation.eventKind]
}
