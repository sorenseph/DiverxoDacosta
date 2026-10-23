import { deliverMail, parseMailRequest } from '../server/mail'

interface NodeResponse {
  status: (code: number) => NodeResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

interface NodeRequest {
  method?: string
  body?: unknown
  on: (event: string, listener: (chunk?: Buffer) => void) => void
}

async function readJson(request: NodeRequest): Promise<unknown> {
  if (request.body && typeof request.body === 'object') return request.body
  if (typeof request.body === 'string') return JSON.parse(request.body) as unknown
  const raw = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk) => {
      if (chunk) chunks.push(chunk)
    })
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', () => reject(new Error('No se pudo leer la solicitud.')))
  })
  return raw ? JSON.parse(raw) as unknown : null
}

export default async function handler(request: NodeRequest, response: NodeResponse) {
  response.setHeader('Content-Type', 'application/json')
  if (request.method !== 'POST') {
    response.status(405).json({ ok: false, error: 'Método no permitido.' })
    return
  }
  const apiKey = process.env.RESEND_API_KEY ?? ''
  const from = process.env.RESEND_FROM ?? 'DiverxoDacosta <israelcardenas6@gmail.com>'
  if (!apiKey) {
    response.status(500).json({ ok: false, error: 'Falta la clave de correo en el servidor.' })
    return
  }
  try {
    const mail = parseMailRequest(await readJson(request))
    if (!mail) {
      response.status(400).json({ ok: false, error: 'La solicitud de correo está incompleta.' })
      return
    }
    const result = await deliverMail(mail, { apiKey, from })
    response.status(result.ok ? 200 : 502).json(result)
  } catch {
    response.status(400).json({ ok: false, error: 'No se pudo leer el correo a enviar.' })
  }
}
