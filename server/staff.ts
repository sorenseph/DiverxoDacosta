import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { hashPassword, verifyPassword } from './passwords'

export interface StaffAccount {
  id: string
  username: string
  fullName: string
  active: boolean
}

export interface StaffShift {
  id: string
  staffId: string
  date: string
  spaceId: string
  activity: string
  startTime: string
  endTime: string
  notes: string
}

interface StaffStored extends StaffAccount {
  passwordHash: string
}

interface LocalDatabase {
  staff: StaffStored[]
  shifts: StaffShift[]
}

const filePath = '.data/staff.json'
const localNotice = 'Las cuentas del equipo se guardan en este equipo hasta aplicar el esquema de Supabase.'

function emptyDatabase(): LocalDatabase {
  return { staff: [], shifts: [] }
}

function readLocal(): LocalDatabase {
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as LocalDatabase
    return {
      staff: Array.isArray(parsed.staff) ? parsed.staff : [],
      shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [],
    }
  } catch {
    return emptyDatabase()
  }
}

function writeLocal(database: LocalDatabase) {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(database))
}

function cloud() {
  const url = process.env.VITE_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SECRET_KEY ?? ''
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function mapStaff(row: { id: string; username: string; full_name: string; password_hash: string; active: boolean }): StaffStored {
  return {
    id: String(row.id),
    username: String(row.username),
    fullName: String(row.full_name),
    passwordHash: String(row.password_hash),
    active: row.active !== false,
  }
}

function mapShift(row: { id: string; staff_id: string; event_date: string; space_id: string; activity: string; start_time: string; end_time: string; notes: string }): StaffShift {
  return {
    id: String(row.id),
    staffId: String(row.staff_id),
    date: String(row.event_date).slice(0, 10),
    spaceId: String(row.space_id),
    activity: String(row.activity),
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
    notes: typeof row.notes === 'string' ? row.notes : '',
  }
}

async function readCloud(): Promise<LocalDatabase | null> {
  const client = cloud()
  if (!client) return null
  const staff = await client.from('diverxo_staff').select('id, username, full_name, password_hash, active')
  const shifts = await client.from('diverxo_shifts').select('id, staff_id, event_date, space_id, activity, start_time, end_time, notes')
  if (staff.error || shifts.error) return null
  return {
    staff: (staff.data ?? []).map(mapStaff),
    shifts: (shifts.data ?? []).map(mapShift),
  }
}

function publish(account: StaffStored): StaffAccount {
  return { id: account.id, username: account.username, fullName: account.fullName, active: account.active }
}

export async function listTeam(): Promise<{ staff: StaffAccount[]; shifts: StaffShift[]; notice: string }> {
  const remote = await readCloud()
  if (!remote) {
    const local = readLocal()
    return { staff: local.staff.map(publish), shifts: local.shifts, notice: localNotice }
  }
  return { staff: remote.staff.map(publish), shifts: remote.shifts, notice: '' }
}

export async function createStaff(input: { fullName: string; username: string; password: string }): Promise<{ ok: true; staff: StaffAccount; notice: string } | { ok: false; error: string }> {
  const username = input.username.trim().toLowerCase()
  const fullName = input.fullName.trim()
  if (!/^[a-z0-9.]{3,32}$/.test(username)) return { ok: false, error: 'El usuario lleva de 3 a 32 letras, números o puntos.' }
  if (fullName.length < 3) return { ok: false, error: 'Escribe el nombre del empleado.' }
  if (input.password.length < 8) return { ok: false, error: 'La contraseña del empleado necesita al menos 8 caracteres.' }
  const remote = await readCloud()
  const database = remote ?? readLocal()
  if (database.staff.some((item) => item.username === username)) return { ok: false, error: 'Ese usuario ya existe.' }
  const account: StaffStored = {
    id: crypto.randomUUID(),
    username,
    fullName,
    passwordHash: hashPassword(input.password),
    active: true,
  }
  if (remote) {
    const client = cloud()
    const { error } = await client!.from('diverxo_staff').insert({
      id: account.id,
      username: account.username,
      full_name: account.fullName,
      password_hash: account.passwordHash,
      active: true,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true, staff: publish(account), notice: '' }
  }
  const local = readLocal()
  local.staff.push(account)
  writeLocal(local)
  return { ok: true, staff: publish(account), notice: localNotice }
}

export async function setStaffActive(id: string, active: boolean): Promise<string | null> {
  const remote = await readCloud()
  if (remote) {
    const client = cloud()
    const { error } = await client!.from('diverxo_staff').update({ active }).eq('id', id)
    return error?.message ?? null
  }
  const local = readLocal()
  const account = local.staff.find((item) => item.id === id)
  if (!account) return 'No encontramos a ese empleado.'
  account.active = active
  writeLocal(local)
  return null
}

export async function authenticateStaff(username: string, password: string): Promise<StaffAccount | null> {
  const remote = await readCloud()
  const database = remote ?? readLocal()
  const account = database.staff.find((item) => item.username === username.trim().toLowerCase() && item.active)
  if (!account || !verifyPassword(password, account.passwordHash)) return null
  return publish(account)
}

export async function createShift(input: StaffShift): Promise<{ ok: true; shift: StaffShift; notice: string } | { ok: false; error: string }> {
  const remote = await readCloud()
  const database = remote ?? readLocal()
  if (!database.staff.some((item) => item.id === input.staffId && item.active)) {
    return { ok: false, error: 'Elige un empleado activo.' }
  }
  if (remote) {
    const client = cloud()
    const { error } = await client!.from('diverxo_shifts').insert({
      id: input.id,
      staff_id: input.staffId,
      event_date: input.date,
      space_id: input.spaceId,
      activity: input.activity,
      start_time: input.startTime,
      end_time: input.endTime,
      notes: input.notes,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true, shift: input, notice: '' }
  }
  const local = readLocal()
  local.shifts.push(input)
  writeLocal(local)
  return { ok: true, shift: input, notice: localNotice }
}

export async function removeShift(id: string): Promise<string | null> {
  const remote = await readCloud()
  if (remote) {
    const client = cloud()
    const { error } = await client!.from('diverxo_shifts').delete().eq('id', id)
    return error?.message ?? null
  }
  const local = readLocal()
  local.shifts = local.shifts.filter((item) => item.id !== id)
  writeLocal(local)
  return null
}

export async function shiftsFor(staffId: string): Promise<StaffShift[]> {
  const remote = await readCloud()
  const database = remote ?? readLocal()
  return database.shifts.filter((item) => item.staffId === staffId)
}
