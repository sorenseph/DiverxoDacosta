import { cateringPackages } from '@/data/cateringPackages'
import { serviceById } from '@/data/additionalServices'
import type { CateringPackage, EventSpace, PriceLine, PriceQuote, SelectedAddons } from '@/types/domain'
import { durationMinutes } from '@/utils/time'

export interface QuoteInput {
  space: EventSpace
  guests: number
  startTime: string
  endTime: string
  addons: SelectedAddons
  packages?: readonly CateringPackage[]
}

function line(partial: PriceLine): PriceLine {
  return partial
}

export function quoteEvent(input: QuoteInput): PriceQuote {
  const packages = input.packages ?? cateringPackages
  const lines: PriceLine[] = []
  const included = new Set(input.space.includedConceptIds)

  lines.push(line({
    id: 'space',
    label: `Renta de ${input.space.name}`,
    detail: `${input.space.includedHours} h incluidas · precio por evento`,
    amountMxn: input.space.priceMxn,
    origin: input.space.priceOrigin,
    unit: 'event',
  }))

  const minutes = durationMinutes(input.startTime, input.endTime)
  if (minutes !== null) {
    const billedHours = Math.ceil(minutes / 60)
    const extraHours = billedHours - input.space.includedHours
    if (extraHours > 0) {
      lines.push(line({
        id: 'overtime',
        label: 'Horas adicionales',
        detail: `${extraHours} × tarifa por hora, fuera de las ${input.space.includedHours} h incluidas`,
        amountMxn: extraHours * input.space.extraHourMxn,
        origin: input.space.extraHourOrigin,
        unit: 'hour',
      }))
    }
  }

  if (input.addons.cateringPackageId) {
    const selected = packages.find((item) => item.id === input.addons.cateringPackageId)
    if (selected) {
      const amount = selected.charge === 'per_person' ? selected.amountMxn * input.guests : selected.amountMxn
      const minimum = selected.minGuests !== null && input.guests < selected.minGuests
        ? ` El mínimo es de ${selected.minGuests} invitados.`
        : ''
      const unitText = selected.charge === 'per_person'
        ? `${input.guests} × precio por persona`
        : 'precio por evento'
      lines.push(line({
        id: `catering-${selected.id}`,
        label: selected.name,
        detail: `${unitText}.${minimum}`,
        amountMxn: amount,
        origin: selected.origin,
        unit: selected.charge === 'per_person' ? 'person' : 'event',
      }))
    }
  }

  if (input.addons.waiters && input.guests > 0) {
    const waiters = serviceById('waiters')
    if (waiters && waiters.guestsPerUnit) {
      const count = Math.ceil(input.guests / waiters.guestsPerUnit)
      lines.push(line({
        id: 'waiters',
        label: waiters.name,
        detail: `${count} ${count === 1 ? 'mesero' : 'meseros'} × precio por persona de servicio`,
        amountMxn: count * waiters.amountMxn,
        origin: waiters.origin,
        unit: 'unit',
      }))
    }
  }

  if (input.addons.furniture && input.guests > 0) {
    const furniture = serviceById('furniture')
    if (furniture) {
      if (included.has('furniture')) {
        lines.push(line({
          id: 'furniture',
          label: furniture.name,
          detail: 'Incluido en la renta de este espacio. No se suma otra vez.',
          amountMxn: 0,
          origin: input.space.priceOrigin,
          unit: 'event',
        }))
      } else {
        lines.push(line({
          id: 'furniture',
          label: furniture.name,
          detail: `${input.guests} × precio por persona`,
          amountMxn: furniture.amountMxn * input.guests,
          origin: furniture.origin,
          unit: 'person',
        }))
      }
    }
  }

  return {
    lines,
    totalMxn: lines.reduce((sum, item) => sum + item.amountMxn, 0),
  }
}
