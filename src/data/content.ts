import { media } from '@/data/media'
import type { EventKind } from '@/types/domain'

export interface EventKindOption {
  id: EventKind
  label: string
  description: string
}

export const eventKindOptions: EventKindOption[] = [
  { id: 'boda', label: 'Boda', description: 'Ceremonia y banquete en un mismo relato.' },
  { id: 'xv', label: 'XV años', description: 'Una celebración familiar con presencia y cuidado.' },
  { id: 'cumpleanos', label: 'Cumpleaños', description: 'De la mesa íntima a la fiesta de mayor formato.' },
  { id: 'aniversario', label: 'Aniversario', description: 'Una fecha que merece una mesa bien dispuesta.' },
  { id: 'empresarial', label: 'Evento empresarial', description: 'Juntas, convenciones y encuentros de equipo.' },
  { id: 'familiar', label: 'Bautizo o celebración familiar', description: 'Comidas y rituales compartidos en familia.' },
  { id: 'otro', label: 'Otro', description: 'Cuéntanos la ocasión y armamos la propuesta.' },
]

export const eventKindLabels: Record<EventKind, string> = {
  boda: 'Boda',
  xv: 'XV años',
  cumpleanos: 'Cumpleaños',
  aniversario: 'Aniversario',
  empresarial: 'Evento empresarial',
  familiar: 'Bautizo o celebración familiar',
  otro: 'Otro',
}

export const homeServices = [
  {
    number: '01',
    title: 'Espacios para celebrar',
    text: 'Salón, jardín, terraza y un salón de mayor formato. Cada uno con su capacidad, su renta y las horas que incluye.',
    to: '/espacios',
  },
  {
    number: '02',
    title: 'Banquetes y catering',
    text: 'Propuestas para bodas, reuniones sociales y mesas privadas, con un menú que se ajusta a la ocasión.',
    to: '/catering',
  },
  {
    number: '03',
    title: 'Encuentros de empresa',
    text: 'Coffee breaks, desayunos y comidas de trabajo, con un servicio que respeta la agenda.',
    to: '/catering',
  },
  {
    number: '04',
    title: 'Atención de principio a fin',
    text: 'De la primera conversación al último detalle del día, con alguien que cuida los tiempos para que tú estés con tus invitados.',
    to: '/reservar',
  },
] as const

export const processSteps = [
  {
    number: '01',
    title: 'Conversación',
    text: 'Escuchamos el tipo de celebración, el número de invitados y lo que quieres que se sienta en la mesa.',
  },
  {
    number: '02',
    title: 'Espacio',
    text: 'Revisamos qué lugar acompaña el formato y comprobamos que la fecha no se cruce con otra reservación.',
  },
  {
    number: '03',
    title: 'Mesa',
    text: 'Armamos la propuesta gastronómica. El menú definitivo se confirma según la ocasión y el número de invitados.',
  },
  {
    number: '04',
    title: 'Coordinación',
    text: 'Ordenamos horarios, servicio, mobiliario y los detalles que hacen falta antes del día.',
  },
  {
    number: '05',
    title: 'El evento',
    text: 'El servicio acompaña a los invitados para que la celebración se viva sin perseguir pendientes.',
  },
] as const

export const galleryItems = [
  {
    src: media.hero,
    alt: 'Salón de banquetes preparado con mesas redondas y lámparas de cristal.',
    caption: 'Banquete formal',
    wide: true,
  },
  {
    src: media.ceremony,
    alt: 'Ceremonia al aire libre con pasillo central y arreglos florales.',
    caption: 'Jardín',
    wide: false,
  },
  {
    src: media.tent,
    alt: 'Detalle de mesa bajo una carpa, con copas y flores.',
    caption: 'Montaje',
    wide: false,
  },
  {
    src: media.plate,
    alt: 'Plato de cocina de autor servido en una mesa con copas de vino.',
    caption: 'Cocina',
    wide: false,
  },
  {
    src: media.terrace,
    alt: 'Terraza con mesas servidas frente a un paisaje abierto.',
    caption: 'Terraza',
    wide: false,
  },
  {
    src: media.brunch,
    alt: 'Mesa de desayuno compartido vista desde arriba.',
    caption: 'Mesa de día',
    wide: true,
  },
] as const

export const faqs = [
  {
    question: '¿Qué celebraciones organizan?',
    answer:
      'Bodas, XV años, cumpleaños, aniversarios, bautizos y encuentros de empresa. Si la ocasión es otra, cuéntanosla y armamos la propuesta a partir de ahí.',
  },
  {
    question: '¿El banquete se cobra por persona?',
    answer:
      'Sí. Cada paquete tiene un precio por persona y, cuando aplica, un mínimo de invitados. La renta del espacio se cobra por evento y la hora adicional, por hora.',
  },
  {
    question: '¿Puedo contratar solo el espacio?',
    answer:
      'Sí. Puedes reservar el lugar y sumar catering, meseros o mobiliario solo si el evento los necesita. Lo que ya viene incluido en la renta no se vuelve a cobrar.',
  },
  {
    question: '¿Qué incluye la renta?',
    answer:
      'El uso del lugar durante las horas de cada espacio y la limpieza al cierre. La terraza y el salón principal incluyen mesas y sillas. En el salón y el jardín, el mobiliario se cotiza aparte.',
  },
  {
    question: '¿Se puede alargar el horario?',
    answer:
      'Sí. Si el evento rebasa las horas incluidas, cada hora adicional se suma a la cotización según el espacio elegido.',
  },
  {
    question: '¿Con cuánta anticipación conviene apartar la fecha?',
    answer:
      'Para una boda o un fin de semana concurrido, conviene empezar con varias semanas de margen. Si la fecha está cerca, la revisamos según la agenda del espacio.',
  },
  {
    question: '¿Pueden considerar restricciones alimentarias?',
    answer:
      'Sí. Al confirmar el menú revisamos alergias, preferencias y los ajustes de la mesa. El paquete es el punto de partida, no una carta cerrada.',
  },
  {
    question: '¿Cómo se confirma la fecha?',
    answer:
      'Revisamos que el horario siga libre y te compartimos el presupuesto. La fecha queda sujeta a disponibilidad, a la confirmación de servicios y a la cotización final.',
  },
] as const

export const aboutPrinciples = [
  {
    title: 'El lugar',
    text: 'El espacio debe parecerse a la celebración: más recogido o más amplio, de día o de noche, formal o contemporáneo.',
  },
  {
    title: 'La mesa',
    text: 'La comida se piensa como parte de la experiencia, con una presentación clara y un servicio que no estorba.',
  },
  {
    title: 'La atención',
    text: 'Alguien tiene que cuidar los tiempos, las dudas y los detalles para que tú puedas estar con tus invitados.',
  },
] as const

export const occupiedDateHints = [
  'Salón, 14 de noviembre de 2026, de 15:00 a 19:00. A las 19:00 ya puede iniciar otro evento.',
  'Salón principal, el mismo 14 de noviembre, de 09:00 a 14:00. El siguiente evento puede empezar a las 14:30.',
  'Jardín, 5 de diciembre de 2026, de 13:00 a 18:00.',
  'Terraza, 28 de noviembre de 2026, de 18:00 a 23:00.',
] as const
