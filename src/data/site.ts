/** Contacto de DiverxoDacosta. */
export const siteContact = {
  email: 'hola@diverxodacosta.com',
  phoneDisplay: '435 103 6808',
  phoneHref: 'tel:+524351036808',
  address: 'Ciudad de México',
  hours: 'Lunes a sábado, de 10:00 a 19:00',
} as const

export const siteMeta = {
  name: 'DiverxoDacosta',
  tagline: 'El arte de servir',
  description:
    'Catering, banquetes y renta de espacios para bodas, celebraciones y eventos de empresa en la Ciudad de México.',
} as const

export const navigation = [
  { to: '/', label: 'Inicio' },
  { to: '/espacios', label: 'Espacios' },
  { to: '/catering', label: 'Catering' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
  { to: '/cuenta', label: 'Cuenta' },
] as const
