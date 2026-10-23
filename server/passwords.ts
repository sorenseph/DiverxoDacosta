import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export function sameSecret(left: string, right: string): boolean {
  const a = createHash('sha256').update(left).digest()
  const b = createHash('sha256').update(right).digest()
  return timingSafeEqual(a, b)
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('base64url')
  const hash = scryptSync(password, salt, 32).toString('base64url')
  return `scrypt$${salt}$${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algo, salt, hash] = stored.split('$')
  if (algo !== 'scrypt' || !salt || !hash) return false
  const next = scryptSync(password, salt, 32)
  const previous = Buffer.from(hash, 'base64url')
  if (next.length !== previous.length) return false
  return timingSafeEqual(next, previous)
}

export function adminCredentialsMatch(username: string, password: string): boolean {
  const expectedUser = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase()
  const expectedPass = process.env.ADMIN_PASSWORD || ''
  const userOk = sameSecret(username.trim().toLowerCase(), expectedUser)
  const passOk = expectedPass.length >= 8 && sameSecret(password, expectedPass)
  return userOk && passOk
}
