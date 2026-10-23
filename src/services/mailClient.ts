import type { MailRequest } from '../../server/mail'

export async function sendMail(request: MailRequest): Promise<string | null> {
  try {
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (response.ok) return null
    const body = await response.json() as { error?: string }
    return body.error ?? 'No se pudo enviar el correo.'
  } catch {
    return 'No se pudo enviar el correo.'
  }
}
