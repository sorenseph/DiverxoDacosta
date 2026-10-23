import { quoteEvent } from '@/services/pricingService'
import { getSpaceById } from '@/services/spacesService'
import type { QuoteRequest, Reservation, SelectedAddons } from '@/types/domain'

function reservation(
  input: Pick<Reservation, 'id' | 'folio' | 'status' | 'eventKind' | 'date' | 'startTime' | 'endTime' | 'spaceId' | 'guests' | 'client'> & {
    packageId?: string
    createdAt: string
  },
): Reservation {
  const space = getSpaceById(input.spaceId)
  if (!space) throw new Error(`No existe el espacio ${input.spaceId}`)
  const addons: SelectedAddons = {
    cateringPackageId: input.packageId ?? null,
    waiters: true,
    furniture: true,
    decoration: false,
    extraIds: [],
  }
  return {
    id: input.id,
    folio: input.folio,
    status: input.status,
    createdAt: input.createdAt,
    eventKind: input.eventKind,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    spaceId: input.spaceId,
    guests: input.guests,
    addons,
    client: input.client,
    pricing: quoteEvent({
      space,
      guests: input.guests,
      startTime: input.startTime,
      endTime: input.endTime,
      addons,
    }),
  }
}

/** Reservaciones iniciales. No mutar este arreglo: el almacén trabaja con copias. */
export const seedReservations: Reservation[] = [
  reservation({
    id: 'seed-aurea-nov',
    folio: 'DX-20261114-4821',
    status: 'confirmada',
    eventKind: 'boda',
    date: '2026-11-14',
    startTime: '15:00',
    endTime: '19:00',
    spaceId: 'aurea',
    guests: 86,
    packageId: 'banquete-superior',
    createdAt: '2026-09-12T16:20:00.000Z',
    client: {
      fullName: 'Mariana Herrera',
      email: 'mariana.herrera@gmail.com',
      phone: '5544182036',
      notes: 'Boda. Recepción y cena en el salón.',
    },
  }),
  reservation({
    id: 'seed-reserva-nov',
    folio: 'DX-20261114-7036',
    status: 'confirmada',
    eventKind: 'empresarial',
    date: '2026-11-14',
    startTime: '09:00',
    endTime: '14:00',
    spaceId: 'reserva',
    guests: 160,
    packageId: 'comida-corporativa',
    createdAt: '2026-09-18T11:05:00.000Z',
    client: {
      fullName: 'Laura Méndez',
      email: 'laura.mendez@grupoalameda.mx',
      phone: '5555128841',
      notes: 'Comida de trabajo para el equipo comercial.',
    },
  }),
  reservation({
    id: 'seed-nebula-nov',
    folio: 'DX-20261128-2194',
    status: 'confirmada',
    eventKind: 'aniversario',
    date: '2026-11-28',
    startTime: '18:00',
    endTime: '23:00',
    spaceId: 'nebula',
    guests: 32,
    packageId: 'banquete-intermedio',
    createdAt: '2026-10-02T19:40:00.000Z',
    client: {
      fullName: 'Ana Navarro',
      email: 'ana.navarro@gmail.com',
      phone: '5522901844',
      notes: 'Cena de aniversario en la terraza.',
    },
  }),
  reservation({
    id: 'seed-magnolia-dic',
    folio: 'DX-20261205-5518',
    status: 'confirmada',
    eventKind: 'familiar',
    date: '2026-12-05',
    startTime: '13:00',
    endTime: '18:00',
    spaceId: 'magnolia',
    guests: 90,
    packageId: 'banquete-intermedio',
    createdAt: '2026-10-08T14:15:00.000Z',
    client: {
      fullName: 'Carmen Ortega',
      email: 'carmen.ortega@outlook.com',
      phone: '5533671902',
      notes: 'Comida familiar en el jardín.',
    },
  }),
  reservation({
    id: 'seed-aurea-libre',
    folio: 'DX-20261121-3307',
    status: 'cancelada',
    eventKind: 'cumpleanos',
    date: '2026-11-21',
    startTime: '12:00',
    endTime: '16:00',
    spaceId: 'aurea',
    guests: 48,
    packageId: 'taquiza',
    createdAt: '2026-09-28T10:10:00.000Z',
    client: {
      fullName: 'Sofía Campos',
      email: 'sofia.campos@gmail.com',
      phone: '5548126630',
      notes: 'Cumpleaños. La fecha se liberó.',
    },
  }),
  reservation({
    id: 'seed-aurea-dic',
    folio: 'DX-20261212-8640',
    status: 'pendiente',
    eventKind: 'xv',
    date: '2026-12-12',
    startTime: '16:00',
    endTime: '22:00',
    spaceId: 'aurea',
    guests: 94,
    packageId: 'banquete-superior',
    createdAt: '2026-10-15T18:30:00.000Z',
    client: {
      fullName: 'Valentina Ríos',
      email: 'valentina.rios@gmail.com',
      phone: '5519037745',
      notes: 'XV años. Pendiente de confirmar el menú.',
    },
  }),
]

export const seedQuotes: QuoteRequest[] = []
