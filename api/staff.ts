import { issueStaffToken, readStaffToken } from '../server/otp.ts'
import { authenticateStaff, shiftsFor } from '../server/staff.ts'

interface NodeResponse {
  status: (code: number) => NodeResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

interface NodeRequest {
  method?: string
  body?: unknown
  headers?: Record<string, string | string[] | undefined>
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

function bearer(request: NodeRequest): string {
  const header = request.headers?.authorization ?? request.headers?.Authorization
  const value = Array.isArray(header) ? header[0] : header
  return value?.startsWith('Bearer ') ? value.slice(7).trim() : ''
}

export default async function handler(request: NodeRequest, response: NodeResponse) {
  response.setHeader('Content-Type', 'application/json')
  if (request.method !== 'POST') {
    response.status(405).json({ ok: false, error: 'Método no permitido.' })
    return
  }
  try {
    const body = await readJson(request) as { action?: string; username?: string; password?: string }
    if (body.action === 'login') {
      if (typeof body.username !== 'string' || typeof body.password !== 'string') {
        response.status(400).json({ ok: false, error: 'Escribe usuario y contraseña.' })
        return
      }
      const account = await authenticateStaff(body.username, body.password)
      if (!account) {
        response.status(401).json({ ok: false, error: 'Usuario o contraseña incorrectos.' })
        return
      }
      const token = issueStaffToken(account.id, account.username)
      if (!token) {
        response.status(500).json({ ok: false, error: 'No se pudo abrir la sesión.' })
        return
      }
      response.status(200).json({ ok: true, token, staff: account })
      return
    }
    const session = readStaffToken(bearer(request))
    if (!session) {
      response.status(401).json({ ok: false, error: 'La sesión caducó. Entra de nuevo.' })
      return
    }
    if (body.action === 'agenda') {
      const shifts = await shiftsFor(session.staffId)
      response.status(200).json({ ok: true, username: session.username, shifts })
      return
    }
    response.status(400).json({ ok: false, error: 'La solicitud está incompleta.' })
  } catch {
    response.status(400).json({ ok: false, error: 'No se pudo leer la solicitud.' })
  }
}
