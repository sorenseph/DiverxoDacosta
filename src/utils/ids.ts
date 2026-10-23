export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function createFolio(date: string, existing: readonly string[]): string {
  const compact = date.replaceAll('-', '')
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
    const folio = `DX-${compact}-${suffix}`
    if (!existing.includes(folio)) return folio
  }
  return `DX-${compact}-${Date.now().toString(36).toUpperCase()}`
}
