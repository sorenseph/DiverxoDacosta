import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import adminHandler from './api/admin.ts'
import staffHandler from './api/staff.ts'
import verifyHandler from './api/verify.ts'
import { deliverMail, parseMailRequest } from './server/mail.ts'
import { storeQuote, storeReservation, type QuoteRecord, type ReservationRecord } from './server/records.ts'

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })
}

function localApi(): Plugin {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
        const url = request.url?.split('?')[0]
        if (url !== '/api/email' && url !== '/api/reservation' && url !== '/api/verify' && url !== '/api/admin' && url !== '/api/staff') {
          next()
          return
        }
        const env = loadEnv(server.config.mode, process.cwd(), '')
        Object.assign(process.env, env)
        response.setHeader('Content-Type', 'application/json')
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end(JSON.stringify({ ok: false, error: 'Método no permitido.' }))
          return
        }
        try {
          if (url === '/api/verify' || url === '/api/admin' || url === '/api/staff') {
            const raw = await readBody(request)
            const body = raw ? JSON.parse(raw) as unknown : null
            let statusCode = 200
            let payload: unknown = { ok: false }
            const sink = {
              setHeader() {
                return undefined
              },
              status(code: number) {
                statusCode = code
                return sink
              },
              json(data: unknown) {
                payload = data
              },
            }
            const handler = url === '/api/admin' ? adminHandler : url === '/api/staff' ? staffHandler : verifyHandler
            await handler({
              method: request.method,
              body,
              headers: request.headers,
              on: () => undefined,
            }, sink)
            response.statusCode = statusCode
            response.end(JSON.stringify(payload))
            return
          }
          const body = JSON.parse(await readBody(request) || 'null') as {
            action?: string
            reservation?: ReservationRecord
            quote?: QuoteRecord
          }
          if (url === '/api/email') {
            const mail = parseMailRequest(body)
            if (!mail || !env.RESEND_API_KEY) {
              response.statusCode = 400
              response.end(JSON.stringify({ ok: false, error: 'No se pudo preparar el correo.' }))
              return
            }
            const result = await deliverMail(mail, {
              apiKey: env.RESEND_API_KEY,
              from: env.RESEND_FROM || 'DiverxoDacosta <israelcardenas6@gmail.com>',
            })
            response.statusCode = result.ok ? 200 : 502
            response.end(JSON.stringify(result))
            return
          }
          const error = body.action === 'quote' && body.quote
            ? await storeQuote(body.quote)
            : body.action === 'reservation' && body.reservation
              ? await storeReservation(body.reservation)
              : 'La solicitud está incompleta.'
          response.statusCode = error ? 502 : 200
          response.end(JSON.stringify(error ? { ok: false, error } : { ok: true }))
        } catch {
          response.statusCode = 400
          response.end(JSON.stringify({ ok: false, error: 'No se pudo leer la solicitud.' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), localApi()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
