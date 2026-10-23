function e164(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+52${digits}`
  if (digits.length === 12 && digits.startsWith('52')) return `+${digits}`
  if (digits.length === 13 && digits.startsWith('521')) return `+52${digits.slice(3)}`
  return null
}

export async function deliverSms(phone: string, body: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const to = e164(phone)
  const sid = process.env.TWILIO_ACCOUNT_SID ?? ''
  const token = process.env.TWILIO_AUTH_TOKEN ?? ''
  const from = process.env.TWILIO_FROM ?? ''
  if (!to) return { ok: false, error: 'El teléfono no tiene un formato válido.' }
  if (!sid || !token || !from) {
    return { ok: false, error: 'El código por SMS todavía no está activo. Confirma con tu correo: llega en unos segundos.' }
  }
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  })
  if (response.ok) return { ok: true }
  const detail = await response.text()
  return { ok: false, error: detail.slice(0, 240) || 'No se pudo enviar el SMS.' }
}
