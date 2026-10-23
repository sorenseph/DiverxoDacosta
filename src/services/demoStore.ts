import { seedQuotes, seedReservations } from '@/data/seed'
import type { DateClosure, DemoDatabase, EventKind, QuoteRequest, Reservation, ReservationStatus, SelectedAddons } from '@/types/domain'

const STORAGE_KEY = 'diverxo-dacosta.v3'
const STORAGE_VERSION = 1

export class DemoStoreError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DemoStoreError'
  }
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface DemoStore {
  read(): DemoDatabase
  write(database: DemoDatabase): void
  reset(): DemoDatabase
}

/**
 * Persistencia local de reservaciones y solicitudes.
 * Hoy usa localStorage o memoria. Para producción, sustituye esta pieza
 * por Supabase o una API manteniendo la misma interfaz DemoStore.
 * localStorage no comparte disponibilidad entre personas ni dispositivos.
 */
export function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: (key) => {
      map.delete(key)
    },
  }
}

export function cloneSeedDatabase(): DemoDatabase {
  return {
    reservations: structuredClone(seedReservations),
    quotes: structuredClone(seedQuotes),
    closures: [],
  }
}

const statuses = new Set<ReservationStatus>(['pendiente', 'confirmada', 'cancelada'])
const eventKinds = new Set<EventKind>(['boda', 'xv', 'cumpleanos', 'aniversario', 'empresarial', 'familiar', 'otro'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readAddons(value: unknown): SelectedAddons {
  if (!isRecord(value)) {
    return { cateringPackageId: null, waiters: false, furniture: false, decoration: false, extraIds: [] }
  }
  const extraIds = Array.isArray(value.extraIds)
    ? value.extraIds.filter((item): item is string => typeof item === 'string')
    : []
  return {
    cateringPackageId: typeof value.cateringPackageId === 'string' ? value.cateringPackageId : null,
    waiters: value.waiters === true,
    furniture: value.furniture === true,
    decoration: value.decoration === true,
    extraIds,
  }
}

function readReservation(value: unknown): Reservation | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || typeof value.folio !== 'string') return null
  if (typeof value.spaceId !== 'string' || typeof value.date !== 'string') return null
  if (typeof value.startTime !== 'string' || typeof value.endTime !== 'string') return null
  if (typeof value.status !== 'string' || !statuses.has(value.status as ReservationStatus)) return null
  if (typeof value.eventKind !== 'string' || !eventKinds.has(value.eventKind as EventKind)) return null
  if (typeof value.guests !== 'number' || typeof value.createdAt !== 'string') return null
  if (!isRecord(value.client) || typeof value.client.fullName !== 'string' || typeof value.client.email !== 'string') {
    return null
  }
  if (!isRecord(value.pricing) || typeof value.pricing.totalMxn !== 'number' || !Array.isArray(value.pricing.lines)) {
    return null
  }
  const lines = value.pricing.lines.filter(isRecord).map((line) => ({
    id: typeof line.id === 'string' ? line.id : 'linea',
    label: typeof line.label === 'string' ? line.label : 'Concepto',
    detail: typeof line.detail === 'string' ? line.detail : '',
    amountMxn: typeof line.amountMxn === 'number' ? line.amountMxn : 0,
  }))
  return {
    id: value.id,
    folio: value.folio,
    status: value.status as ReservationStatus,
    createdAt: value.createdAt,
    eventKind: value.eventKind as EventKind,
    date: value.date,
    startTime: value.startTime,
    endTime: value.endTime,
    spaceId: value.spaceId,
    guests: value.guests,
    addons: readAddons(value.addons),
    client: {
      fullName: value.client.fullName,
      email: typeof value.client.email === 'string' ? value.client.email : '',
      phone: typeof value.client.phone === 'string' ? value.client.phone : '',
      notes: typeof value.client.notes === 'string' ? value.client.notes : '',
    },
    pricing: { lines, totalMxn: value.pricing.totalMxn },
  }
}

function readQuote(value: unknown): QuoteRequest | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || typeof value.createdAt !== 'string') return null
  if (typeof value.name !== 'string' || typeof value.email !== 'string' || typeof value.message !== 'string') return null
  const eventKind = typeof value.eventKind === 'string' && eventKinds.has(value.eventKind as EventKind)
    ? (value.eventKind as EventKind)
    : ''
  return {
    id: value.id,
    createdAt: value.createdAt,
    name: value.name,
    email: value.email,
    phone: typeof value.phone === 'string' ? value.phone : '',
    eventKind,
    tentativeDate: typeof value.tentativeDate === 'string' ? value.tentativeDate : '',
    guests: typeof value.guests === 'number' ? value.guests : null,
    message: value.message,
  }
}

function readClosure(value: unknown): DateClosure | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || typeof value.date !== 'string' || typeof value.reason !== 'string') return null
  if (typeof value.createdAt !== 'string') return null
  if (value.spaceId !== null && typeof value.spaceId !== 'string') return null
  return {
    id: value.id,
    spaceId: value.spaceId,
    date: value.date,
    reason: value.reason,
    createdAt: value.createdAt,
  }
}

function parseDatabase(value: unknown): DemoDatabase | null {
  if (!isRecord(value) || value.version !== STORAGE_VERSION) return null
  if (!Array.isArray(value.reservations) || !Array.isArray(value.quotes)) return null
  const closures = Array.isArray(value.closures)
    ? value.closures.map(readClosure).filter((item): item is DateClosure => item !== null)
    : []
  return {
    reservations: value.reservations.map(readReservation).filter((item): item is Reservation => item !== null),
    quotes: value.quotes.map(readQuote).filter((item): item is QuoteRequest => item !== null),
    closures,
  }
}

export function createDemoStore(storage: StorageLike): DemoStore {
  let cache: DemoDatabase | null = null

  function persist(database: DemoDatabase) {
    const snapshot = structuredClone(database)
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, ...snapshot }))
    } catch {
      throw new DemoStoreError('No se pudo guardar la reservación. Inténtalo de nuevo.')
    }
    cache = snapshot
  }

  function read(): DemoDatabase {
    if (cache) return structuredClone(cache)
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = cloneSeedDatabase()
      try {
        persist(seeded)
      } catch {
        cache = seeded
      }
      return structuredClone(cache ?? seeded)
    }
    try {
      const parsed = parseDatabase(JSON.parse(raw) as unknown)
      if (!parsed) {
        const seeded = cloneSeedDatabase()
        cache = seeded
        return structuredClone(seeded)
      }
      cache = parsed
      return structuredClone(parsed)
    } catch {
      const seeded = cloneSeedDatabase()
      cache = seeded
      return structuredClone(seeded)
    }
  }

  function write(database: DemoDatabase) {
    const currentIds = new Set<string>()
    for (const reservation of database.reservations) {
      if (currentIds.has(reservation.id) || currentIds.has(reservation.folio)) {
        throw new DemoStoreError('Hay un folio o un identificador repetido.')
      }
      currentIds.add(reservation.id)
      currentIds.add(reservation.folio)
    }
    persist(database)
  }

  function reset(): DemoDatabase {
    storage.removeItem(STORAGE_KEY)
    cache = null
    return read()
  }

  return { read, write, reset }
}

export function resolveBrowserStorage(): StorageLike {
  try {
    if (typeof localStorage === 'undefined') return createMemoryStorage()
    const probe = '__diverxo_probe__'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return localStorage
  } catch {
    return createMemoryStorage()
  }
}
