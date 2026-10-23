import { spaces } from '@/data/spaces'
import { checkAvailability } from '@/services/availabilityService'
import type { AvailabilityResult, DateClosure, EventSpace, Reservation, SpaceKind } from '@/types/domain'

export interface SpaceQuery {
  kind: SpaceKind | 'todos'
  guests: number | null
  budgetMxn: number | null
  date: string
  startTime: string
  endTime: string
  availability: 'todas' | 'disponibles' | 'ocupadas'
}

export interface SpaceListing {
  space: EventSpace
  availability: AvailabilityResult | null
}

export function listSpaces(): readonly EventSpace[] {
  return spaces
}

export function getSpaceById(spaceId: string): EventSpace | undefined {
  return spaces.find((space) => space.id === spaceId)
}

const legacySlugs: Record<string, string> = {
  'espacio-demostracion-a': 'salon',
  'espacio-demostracion-b': 'jardin',
  'espacio-demostracion-c': 'terraza',
  'espacio-demostracion-d': 'salon-principal',
}

export function getSpaceBySlug(slug: string): EventSpace | undefined {
  const current = legacySlugs[slug] ?? slug
  return spaces.find((space) => space.slug === current)
}

export function filterSpaces(
  query: SpaceQuery,
  reservations: readonly Reservation[],
  now: Date,
  closures: readonly DateClosure[] = [],
): { items: SpaceListing[]; note: string | null } {
  const hasDate = query.date.trim().length > 0
  const startTime = query.startTime || '16:00'
  const endTime = query.endTime || '22:00'
  const note = hasDate && (!query.startTime || !query.endTime)
    ? 'Sin un horario completo, la disponibilidad se calcula de 16:00 a 22:00.'
    : null

  const items = spaces
    .filter((space) => query.kind === 'todos' || space.kind === query.kind)
    .filter((space) => query.guests === null || query.guests <= space.capacityMax)
    .filter((space) => query.budgetMxn === null || space.priceMxn <= query.budgetMxn)
    .map((space) => {
      const availability = hasDate
        ? checkAvailability(
            {
              spaceId: space.id,
              date: query.date,
              startTime,
              endTime,
              guests: query.guests ?? undefined,
            },
            spaces,
            reservations,
            now,
            closures,
          )
        : null
      return { space, availability }
    })
    .filter((item) => {
      if (!hasDate || query.availability === 'todas' || !item.availability) return true
      if (query.availability === 'disponibles') return item.availability.available
      return !item.availability.available
    })

  return { items, note }
}
