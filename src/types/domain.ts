export type SpaceKind = 'salon' | 'jardin' | 'terraza' | 'recinto'

/** Origen de una cifra. Ningún precio de esta etapa está verificado con la empresa. */
export type PriceOrigin = 'verified' | 'market_estimate' | 'demo'

export type PriceUnit = 'event' | 'person' | 'hour' | 'unit'

export type EventKind =
  | 'boda'
  | 'xv'
  | 'cumpleanos'
  | 'aniversario'
  | 'empresarial'
  | 'familiar'
  | 'otro'

export type ReservationStatus = 'pendiente' | 'confirmada' | 'cancelada'

export type AvailabilityCode =
  | 'available'
  | 'space_not_found'
  | 'invalid_date'
  | 'past_date'
  | 'invalid_time_range'
  | 'overlap'
  | 'over_capacity'

export interface SpaceImage {
  src: string
  alt: string
}

export interface EventSpace {
  id: string
  slug: string
  name: string
  kind: SpaceKind
  summary: string
  description: string
  capacityMin: number
  capacityMax: number
  /** Ciudad o zona del espacio. */
  locationLabel: string
  amenities: string[]
  /** Renta por evento, no por persona. */
  priceMxn: number
  priceOrigin: PriceOrigin
  includedHours: number
  /** Cargo por cada hora que supere las horas incluidas. */
  extraHourMxn: number
  extraHourOrigin: PriceOrigin
  /**
   * Precio distinto según el día (0 domingo … 6 sábado).
   * null: no hay tarifa por día publicada ni configurada.
   */
  weekdayPricesMxn: Partial<Record<number, number>> | null
  /** Conceptos que ya entran en la renta y no deben cobrarse otra vez. */
  includedConceptIds: string[]
  includedServices: string[]
  /**
   * Minutos que deben quedar libres después de cada evento.
   * Con 0, un horario que empieza cuando otro termina es válido.
   */
  turnoverMinutes: number
  images: SpaceImage[]
  highlights: string[]
}

export interface CateringPackage {
  id: string
  name: string
  summary: string
  description: string
  /** per_person: se multiplica por invitados. event: cargo único. */
  charge: 'per_person' | 'event'
  amountMxn: number
  origin: PriceOrigin
  minGuests: number | null
  included: string[]
  excluded: string[]
  serviceHours: number
  conditions: string
}

export interface AddonService {
  id: string
  name: string
  description: string
  pricing: 'flat' | 'per_guest' | 'per_unit'
  amountMxn: number
  origin: PriceOrigin
  /** Solo para pricing per_unit, por ejemplo un mesero cada N invitados. */
  guestsPerUnit?: number
}

export interface SelectedAddons {
  cateringPackageId: string | null
  waiters: boolean
  furniture: boolean
  decoration: boolean
  extraIds: string[]
}

export interface ClientDetails {
  fullName: string
  email: string
  phone: string
  notes: string
}

export interface PriceLine {
  id: string
  label: string
  detail: string
  amountMxn: number
  origin?: PriceOrigin
  unit?: PriceUnit
}

export interface PriceQuote {
  lines: PriceLine[]
  totalMxn: number
}

export interface Reservation {
  id: string
  folio: string
  status: ReservationStatus
  createdAt: string
  eventKind: EventKind
  date: string
  startTime: string
  endTime: string
  spaceId: string
  guests: number
  addons: SelectedAddons
  client: ClientDetails
  pricing: PriceQuote
}

export interface QuoteRequest {
  id: string
  createdAt: string
  name: string
  email: string
  phone: string
  eventKind: EventKind | ''
  tentativeDate: string
  guests: number | null
  message: string
}

export interface TimeSlotSuggestion {
  spaceId: string
  spaceName: string
  date: string
  startTime: string
  endTime: string
  reason: string
}

export interface AvailabilityResult {
  available: boolean
  code: AvailabilityCode
  message: string
  conflictingReservationId?: string
  alternatives: TimeSlotSuggestion[]
}

export interface AvailabilityQuery {
  spaceId: string
  date: string
  startTime: string
  endTime: string
  guests?: number
  excludeReservationId?: string
}

export interface DemoDatabase {
  reservations: Reservation[]
  quotes: QuoteRequest[]
}

export interface BookingDraft {
  eventKind: EventKind | ''
  date: string
  startTime: string
  endTime: string
  spaceId: string
  guests: number | null
  addons: SelectedAddons
  client: ClientDetails
}

export interface ReservationDraft {
  eventKind: EventKind
  date: string
  startTime: string
  endTime: string
  spaceId: string
  guests: number
  addons: SelectedAddons
  client: ClientDetails
}
