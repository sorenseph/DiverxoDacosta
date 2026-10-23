import type { CateringPackage } from '@/types/domain'

const serviceNote =
  'El menú se confirma según la temporada, el número de invitados y la logística del evento.'

/**
 * Paquetes de partida. El menú final se ajusta al evento.
 */
export const cateringPackages: CateringPackage[] = [
  {
    id: 'taquiza',
    name: 'Taquiza',
    summary: 'Menú sencillo para una comida de pie o en mesa.',
    description:
      'Un servicio breve con guisados, tortillas y agua de sabor, pensado para una comida relajada.',
    charge: 'per_person',
    amountMxn: 280,
    origin: 'verified',
    minGuests: 40,
    included: ['Tres guisados', 'Tortillas y salsas', 'Agua fresca'],
    excluded: ['Bebidas alcohólicas', 'Postre', 'Meseros', 'Mobiliario', 'Renta del espacio', 'Mantelería'],
    serviceHours: 3,
    conditions: serviceNote,
  },
  {
    id: 'banquete-intermedio',
    name: 'Banquete intermedio',
    summary: 'Una comida con entrada, plato fuerte y postre.',
    description:
      'Entrada, plato fuerte y postre. El lugar, el personal y el montaje se cotizan aparte.',
    charge: 'per_person',
    amountMxn: 480,
    origin: 'verified',
    minGuests: 30,
    included: ['Entrada o botana', 'Un plato fuerte', 'Postre', 'Agua de sabor'],
    excluded: ['Bebidas alcohólicas', 'Renta del espacio', 'Mobiliario', 'Meseros', 'Decoración', 'Café continuo'],
    serviceHours: 4,
    conditions: serviceNote,
  },
  {
    id: 'banquete-superior',
    name: 'Banquete formal',
    summary: 'Más tiempos en la mesa, para una celebración formal.',
    description:
      'Recepción, entrada, plato fuerte y postre, con un servicio pensado para no apurar la mesa.',
    charge: 'per_person',
    amountMxn: 850,
    origin: 'verified',
    minGuests: 40,
    included: ['Recepción breve', 'Entrada', 'Plato fuerte', 'Postre', 'Aguas y café'],
    excluded: ['Bebidas alcohólicas', 'Renta del espacio', 'Mobiliario', 'Meseros', 'Decoración floral', 'Sonido'],
    serviceHours: 5,
    conditions: serviceNote,
  },
  {
    id: 'comida-corporativa',
    name: 'Comida corporativa',
    summary: 'Un tiempo de comida para una junta o una comida de trabajo.',
    description:
      'Un servicio de mesa o buffet de un tiempo, pensado para volver a la agenda.',
    charge: 'per_person',
    amountMxn: 390,
    origin: 'verified',
    minGuests: 20,
    included: ['Un tiempo de comida', 'Agua', 'Café'],
    excluded: ['Coffee break durante toda la jornada', 'Renta del espacio', 'Audio', 'Meseros'],
    serviceHours: 2,
    conditions: serviceNote,
  },
  {
    id: 'coffee-break',
    name: 'Coffee break',
    summary: 'Una pausa breve entre sesiones.',
    description:
      'Café y un bocadillo para una pausa breve, sin convertirla en una comida completa.',
    charge: 'per_person',
    amountMxn: 150,
    origin: 'verified',
    minGuests: 15,
    included: ['Café', 'Pan o bocadillo', 'Fruta'],
    excluded: ['Comida corrida', 'Renta del espacio', 'Meseros dedicados', 'Mobiliario de banquete'],
    serviceHours: 1.5,
    conditions: serviceNote,
  },
]
