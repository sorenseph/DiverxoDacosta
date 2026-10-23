export type MailKind = 'registro' | 'reservacion' | 'cotizacion' | 'cancelacion'

export interface MailLine {
  label: string
  detail: string
  amountMxn: number
}

export interface MailRequest {
  kind: MailKind
  to: string
  name: string
  folio?: string
  when?: string
  space?: string
  guests?: number
  message?: string
  lines?: MailLine[]
  totalMxn?: number
}

const kinds = new Set<MailKind>(['registro', 'reservacion', 'cotizacion', 'cancelacion'])

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export function parseMailRequest(value: unknown): MailRequest | null {
  if (!value || typeof value !== 'object') return null
  const body = value as Record<string, unknown>
  const kind = body.kind
  const to = text(body.to, 160)
  const name = text(body.name, 120)
  if (!kinds.has(kind as MailKind) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || name.length < 2) return null
  const lines = Array.isArray(body.lines)
    ? body.lines.slice(0, 12).flatMap((line) => {
        if (!line || typeof line !== 'object') return []
        const item = line as Record<string, unknown>
        const amount = item.amountMxn
        if (typeof amount !== 'number' || !Number.isFinite(amount)) return []
        return [{ label: text(item.label, 80), detail: text(item.detail, 180), amountMxn: amount }]
      })
    : []
  return {
    kind: kind as MailKind,
    to,
    name,
    folio: text(body.folio, 40),
    when: text(body.when, 120),
    space: text(body.space, 80),
    guests: typeof body.guests === 'number' && Number.isInteger(body.guests) ? body.guests : undefined,
    message: text(body.message, 800),
    lines,
    totalMxn: typeof body.totalMxn === 'number' && Number.isFinite(body.totalMxn) ? body.totalMxn : undefined,
  }
}

function pesos(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function renderMail(request: MailRequest): { subject: string; html: string; text: string } {
  const name = escapeHtml(request.name)
  if (request.kind === 'registro') {
    const subject = 'Tu cuenta en DiverxoDacosta'
    const text = `Hola ${request.name}. Ya puedes entrar a tu cuenta y seguir tus reservaciones.`
    return { subject, text, html: `<p>Hola ${name}.</p><p>Tu cuenta en DiverxoDacosta quedó registrada. Desde ahí puedes seguir tus reservaciones y cotizaciones.</p>` }
  }
  if (request.kind === 'cotizacion') {
    const subject = 'Recibimos tu solicitud de cotización'
    const detail = request.message ? `<p>${escapeHtml(request.message)}</p>` : ''
    const text = `Hola ${request.name}. Recibimos tu solicitud. ${request.message ?? ''}`
    return { subject, text, html: `<p>Hola ${name}.</p><p>Recibimos tu solicitud de cotización. Te contactamos para confirmar disponibilidad y el detalle del evento.</p>${detail}` }
  }
  if (request.kind === 'cancelacion') {
    const subject = `Reservación ${request.folio ?? ''} cancelada`
    const text = `Hola ${request.name}. La reservación ${request.folio ?? ''} quedó cancelada y el horario volvió a estar libre.`
    return { subject, text, html: `<p>Hola ${name}.</p><p>La reservación <strong>${escapeHtml(request.folio ?? '')}</strong> quedó cancelada. El horario volvió a estar libre.</p>` }
  }
  const rows = (request.lines ?? [])
    .map((line) => `<tr><td>${escapeHtml(line.label)}<br><small>${escapeHtml(line.detail)}</small></td><td>${pesos(line.amountMxn)}</td></tr>`)
    .join('')
  const total = request.totalMxn === undefined ? '' : `<p><strong>Total estimado: ${pesos(request.totalMxn)}</strong></p>`
  const subject = `Reservación ${request.folio ?? ''} · DiverxoDacosta`
  const text = [
    `Hola ${request.name}.`,
    `Folio ${request.folio ?? ''}.`,
    request.space ? `Espacio: ${request.space}.` : '',
    request.when ? `Cuándo: ${request.when}.` : '',
    request.guests ? `Invitados: ${request.guests}.` : '',
    ...(request.lines ?? []).map((line) => `${line.label}: ${pesos(line.amountMxn)}`),
    request.totalMxn === undefined ? '' : `Total estimado: ${pesos(request.totalMxn)}.`,
    'Presupuesto estimado sujeto a disponibilidad, confirmación de servicios y cotización final.',
  ].filter(Boolean).join('\n')
  const html = `<p>Hola ${name}.</p><p>Recibimos tu reservación con el folio <strong>${escapeHtml(request.folio ?? '')}</strong>.</p><p>${escapeHtml(request.space ?? '')}<br>${escapeHtml(request.when ?? '')}<br>${request.guests ? `${request.guests} invitados` : ''}</p><table>${rows}</table>${total}<p>Presupuesto estimado sujeto a disponibilidad, confirmación de servicios y cotización final.</p>`
  return { subject, text, html }
}

const resendTestFrom = 'DiverxoDacosta <onboarding@resend.dev>'

async function postMail(request: MailRequest, env: { apiKey: string; from: string }, message: { subject: string; html: string; text: string }): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.from,
      to: [request.to],
      reply_to: 'israelcardenas6@gmail.com',
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  })
  if (response.ok) return { ok: true }
  const detail = await response.text()
  return { ok: false, status: response.status, error: detail.slice(0, 400) }
}

export async function deliverMail(request: MailRequest, env: { apiKey: string; from: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const message = renderMail(request)
  const first = await postMail(request, env, message)
  if (first.ok) return { ok: true }
  const unverified = first.status === 403 && /not verified/i.test(first.error)
  if (unverified && env.from !== resendTestFrom) {
    const second = await postMail(request, { ...env, from: resendTestFrom }, message)
    if (second.ok) return { ok: true }
    return { ok: false, error: second.error }
  }
  return { ok: false, error: first.error }
}
