import { media } from '@/data/media'
import type { EventSpace, SpaceKind } from '@/types/domain'

export const spaceKindLabels: Record<SpaceKind, string> = {
  salon: 'Salón',
  jardin: 'Jardín',
  terraza: 'Terraza',
  recinto: 'Salón amplio',
}

/**
 * Espacios del catálogo. Los identificadores internos se conservan
 * para que las reservaciones ya guardadas sigan encontrando su lugar.
 */
export const spaces: EventSpace[] = [
  {
    id: 'aurea',
    slug: 'salon',
    name: 'Salón',
    kind: 'salon',
    summary: 'Salón interior para una comida o una celebración contenida.',
    description:
      'Un salón cerrado, con luz controlada, para montaje en mesa o teatro. La renta cubre el lugar durante las horas incluidas y la limpieza al cierre. El mobiliario, los alimentos y el personal se agregan aparte.',
    capacityMin: 30,
    capacityMax: 100,
    locationLabel: 'Ciudad de México',
    amenities: ['Salón interior', 'Montaje en mesa o teatro', 'Mobiliario por separado'],
    priceMxn: 11500,
    priceOrigin: 'verified',
    includedHours: 6,
    extraHourMxn: 1900,
    extraHourOrigin: 'verified',
    weekdayPricesMxn: null,
    includedConceptIds: [],
    includedServices: ['Renta del espacio durante las horas incluidas', 'Limpieza básica al cierre'],
    turnoverMinutes: 0,
    images: [
      {
        src: media.hero,
        alt: 'Salón de banquetes con mesas redondas y sillas doradas.',
      },
      {
        src: media.diningRoom,
        alt: 'Comedor con mesas vestidas de blanco.',
      },
    ],
    highlights: ['Hasta 100 invitados', '6 horas incluidas', 'Mobiliario se cotiza aparte'],
  },
  {
    id: 'magnolia',
    slug: 'jardin',
    name: 'Jardín',
    kind: 'jardin',
    summary: 'Jardín para una ceremonia o una comida de día.',
    description:
      'Espacio al aire libre, con acceso para proveeduría y toma eléctrica para el montaje. La renta incluye el uso del jardín y la limpieza al cierre. Mesas, mantelería y servicio se suman si el evento los necesita.',
    capacityMin: 40,
    capacityMax: 140,
    locationLabel: 'Ciudad de México',
    amenities: ['Jardín', 'Toma eléctrica para montaje', 'Mobiliario por separado'],
    priceMxn: 18500,
    priceOrigin: 'verified',
    includedHours: 6,
    extraHourMxn: 2500,
    extraHourOrigin: 'verified',
    weekdayPricesMxn: null,
    includedConceptIds: [],
    includedServices: ['Renta del jardín durante las horas incluidas', 'Acceso para proveeduría', 'Limpieza básica al cierre'],
    turnoverMinutes: 0,
    images: [
      {
        src: media.ceremony,
        alt: 'Pasillo de ceremonia al aire libre.',
      },
      {
        src: media.tent,
        alt: 'Mesa vestida bajo una carpa.',
      },
    ],
    highlights: ['Hasta 140 invitados', 'Aire libre', 'Mobiliario se cotiza aparte'],
  },
  {
    id: 'nebula',
    slug: 'terraza',
    name: 'Terraza',
    kind: 'terraza',
    summary: 'Terraza para un grupo pequeño.',
    description:
      'Un lugar más recogido, pensado para reuniones íntimas. La renta incluye mesas y sillas ligeras para su aforo, además de la limpieza al cierre.',
    capacityMin: 12,
    capacityMax: 40,
    locationLabel: 'Ciudad de México',
    amenities: ['Terraza', 'Mesas y sillas ligeras incluidas', 'Grupo reducido'],
    priceMxn: 8500,
    priceOrigin: 'verified',
    includedHours: 5,
    extraHourMxn: 1500,
    extraHourOrigin: 'verified',
    weekdayPricesMxn: null,
    includedConceptIds: ['furniture'],
    includedServices: [
      'Renta de la terraza durante las horas incluidas',
      'Mesas y sillas ligeras para el aforo',
      'Limpieza básica al cierre',
    ],
    turnoverMinutes: 0,
    images: [
      {
        src: media.terrace,
        alt: 'Terraza con mesas puestas.',
      },
      {
        src: media.restaurant,
        alt: 'Comedor contemporáneo con luz cálida.',
      },
    ],
    highlights: ['Hasta 40 invitados', 'Mobiliario ligero incluido', '5 horas incluidas'],
  },
  {
    id: 'reserva',
    slug: 'salon-principal',
    name: 'Salón principal',
    kind: 'recinto',
    summary: 'Salón amplio para un formato empresarial o un banquete numeroso.',
    description:
      'El espacio de mayor capacidad. La renta incluye mesas y sillas para banquete o teatro, y deja treinta minutos entre un evento y el siguiente para el cambio de montaje. Alimentos, meseros y sonido se cotizan aparte.',
    capacityMin: 80,
    capacityMax: 250,
    locationLabel: 'Ciudad de México',
    amenities: ['Salón amplio', 'Mesas y sillas incluidas', '30 minutos entre eventos'],
    priceMxn: 32000,
    priceOrigin: 'verified',
    includedHours: 8,
    extraHourMxn: 4000,
    extraHourOrigin: 'verified',
    weekdayPricesMxn: null,
    includedConceptIds: ['furniture'],
    includedServices: [
      'Renta del recinto durante las horas incluidas',
      'Mesas y sillas para banquete o teatro',
      'Limpieza final',
    ],
    turnoverMinutes: 30,
    images: [
      {
        src: media.conference,
        alt: 'Salón amplio con mesas redondas.',
      },
      {
        src: media.hero,
        alt: 'Montaje de banquete en un salón grande.',
      },
    ],
    highlights: ['Hasta 250 invitados', 'Mobiliario de banquete incluido', '30 min entre eventos'],
  },
]
