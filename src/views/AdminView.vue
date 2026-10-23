<script setup lang="ts">
import PriceBreakdown from '@/components/booking/PriceBreakdown.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { spaces } from '@/data/spaces'
import { appDemoStore } from '@/services/browserRepository'
import { useDemoStore } from '@/stores/demo'
import type { DateClosure, QuoteRequest, Reservation, ReservationStatus } from '@/types/domain'
import { formatLongDate, formatMxn, formatTimeRange } from '@/utils/money'
import { reservationEventLabel, reservationSpaceName, statusLabels } from '@/utils/reservationText'
import { CalendarOff, CalendarRange, ClipboardList, Inbox, LayoutDashboard, LogOut, Menu, Users, X } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'

usePageMeta('Administración', 'Agenda, clientes y fechas cerradas de DiverxoDacosta.')

interface StaffMember {
  id: string
  username: string
  fullName: string
  active: boolean
}

interface Shift {
  id: string
  staffId: string
  date: string
  spaceId: string
  activity: string
  startTime: string
  endTime: string
  notes: string
}

const TOKEN_KEY = 'diverxo-admin.session'
const demo = useDemoStore()
const token = ref('')
const sessionUser = ref('')
const error = ref('')
const notice = ref('')
const busy = ref(false)
const reservations = ref<Reservation[]>([])
const quotes = ref<QuoteRequest[]>([])
const closures = ref<DateClosure[]>([])
const staff = ref<StaffMember[]>([])
const shifts = ref<Shift[]>([])
const closeDate = ref('')
const closeSpace = ref('')
const closeReason = ref('')
const employeeName = ref('')
const employeeUser = ref('')
const employeePassword = ref('')
const shiftStaff = ref('')
const shiftDate = ref('')
const shiftSpace = ref('aurea')
const shiftActivity = ref('Servicio de mesa')
const shiftStart = ref('16:00')
const shiftEnd = ref('23:00')
const shiftNotes = ref('')
const panel = ref<'resumen' | 'reservaciones' | 'solicitudes' | 'equipo' | 'actividades' | 'fechas'>('resumen')
const menuOpen = ref(false)
const panelMain = ref<HTMLElement | null>(null)

const menu = [
  { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
  { id: 'reservaciones', label: 'Reservaciones', icon: CalendarRange },
  { id: 'solicitudes', label: 'Solicitudes', icon: Inbox },
  { id: 'equipo', label: 'Equipo', icon: Users },
  { id: 'actividades', label: 'Actividades', icon: ClipboardList },
  { id: 'fechas', label: 'Fechas', icon: CalendarOff },
] as const

const panelTitle = computed(() => menu.find((item) => item.id === panel.value)?.label ?? 'Resumen')
const readableNotice = computed(() => {
  if (/schema cache|Could not find the table/i.test(notice.value)) {
    return 'Las reservaciones en la nube aparecen cuando se aplica el esquema de Supabase. Las cuentas del equipo siguen en este equipo.'
  }
  return notice.value
})

function openPanel(id: typeof panel.value) {
  panel.value = id
  menuOpen.value = false
  panelMain.value?.scrollTo({ top: 0 })
}

const upcoming = computed(() => reservations.value.filter((item) => item.status !== 'cancelada').length)
const confirmed = computed(() => reservations.value.filter((item) => item.status === 'confirmada').length)
const pending = computed(() => reservations.value.filter((item) => item.status === 'pendiente').length)
const ordered = computed(() => [...reservations.value].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)))

function spaceLabel(spaceId: string | null) {
  if (!spaceId) return 'Todos los espacios'
  return spaces.find((item) => item.id === spaceId)?.name ?? spaceId
}

async function post(body: Record<string, unknown>, auth = false) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth) headers.Authorization = `Bearer ${token.value}`
  const response = await fetch('/api/admin', { method: 'POST', headers, body: JSON.stringify(body) })
  const payload = await response.json() as {
    ok?: boolean
    error?: string
    ticket?: string
    hint?: string
    token?: string
    username?: string
    reservations?: Reservation[]
    quotes?: QuoteRequest[]
    closures?: DateClosure[]
    staff?: StaffMember[]
    shifts?: Shift[]
    notice?: string
    closure?: DateClosure
  }
  return { response, payload }
}

async function load() {
  const { response, payload } = await post({ action: 'list' }, true)
  if (response.status === 401) {
    token.value = ''
    sessionStorage.removeItem(TOKEN_KEY)
    error.value = payload.error ?? 'Vuelve a entrar.'
    return
  }
  reservations.value = payload.reservations ?? []
  quotes.value = (payload.quotes ?? []).filter((item): item is QuoteRequest => Boolean(item && typeof item === 'object' && 'email' in item))
  staff.value = payload.staff ?? []
  shifts.value = payload.shifts ?? []
  closures.value = (payload.closures ?? []).map((item) => ({
    id: item.id,
    spaceId: item.spaceId,
    date: item.date,
    reason: item.reason,
    createdAt: item.createdAt ?? '',
  }))
  notice.value = payload.notice ?? ''
  if (payload.username) sessionUser.value = payload.username
  const database = appDemoStore.read()
  appDemoStore.write({ ...database, closures: closures.value })
  demo.refresh()
}

function mirrorStatus(id: string, status: ReservationStatus) {
  const database = appDemoStore.read()
  const index = database.reservations.findIndex((item) => item.id === id)
  if (index < 0) return
  const next = database.reservations.slice()
  const current = next[index]
  if (!current) return
  next[index] = { ...current, status }
  appDemoStore.write({ ...database, reservations: next })
  demo.refresh()
}

async function setStatus(id: string, status: ReservationStatus) {
  error.value = ''
  busy.value = true
  const { response, payload } = await post({ action: 'status', id, status }, true)
  busy.value = false
  mirrorStatus(id, status)
  const current = reservations.value.find((item) => item.id === id)
  if (current) current.status = status
  if (!response.ok) error.value = payload.error ?? 'No se pudo actualizar en la nube.'
}

async function closeDay() {
  error.value = ''
  busy.value = true
  const { response, payload } = await post({
    action: 'close',
    date: closeDate.value,
    spaceId: closeSpace.value || null,
    reason: closeReason.value,
  }, true)
  busy.value = false
  if (!response.ok || !payload.closure) {
    error.value = payload.error ?? 'No se pudo cerrar la fecha.'
    return
  }
  const closure: DateClosure = {
    id: payload.closure.id,
    spaceId: payload.closure.spaceId,
    date: payload.closure.date,
    reason: payload.closure.reason,
    createdAt: payload.closure.createdAt ?? new Date().toISOString(),
  }
  closures.value = [...closures.value.filter((item) => item.id !== closure.id), closure]
  const database = appDemoStore.read()
  appDemoStore.write({ ...database, closures: closures.value })
  demo.refresh()
  closeReason.value = ''
}

async function reopen(id: string) {
  error.value = ''
  const { response, payload } = await post({ action: 'open', id }, true)
  if (!response.ok) {
    error.value = payload.error ?? 'No se pudo abrir la fecha.'
    return
  }
  closures.value = closures.value.filter((item) => item.id !== id)
  const database = appDemoStore.read()
  appDemoStore.write({ ...database, closures: closures.value })
  demo.refresh()
}

async function createEmployee() {
  error.value = ''
  busy.value = true
  const { response, payload } = await post({
    action: 'staff-create',
    fullName: employeeName.value,
    username: employeeUser.value,
    password: employeePassword.value,
  }, true)
  busy.value = false
  if (!response.ok) {
    error.value = payload.error ?? 'No se pudo crear la cuenta.'
    return
  }
  employeePassword.value = ''
  employeeName.value = ''
  employeeUser.value = ''
  notice.value = payload.notice || 'La cuenta quedó creada.'
  await load()
}

async function toggleStaff(member: StaffMember) {
  error.value = ''
  const { response, payload } = await post({ action: 'staff-active', id: member.id, active: !member.active }, true)
  if (!response.ok) {
    error.value = payload.error ?? 'No se pudo actualizar la cuenta.'
    return
  }
  await load()
}

async function assignShift() {
  error.value = ''
  busy.value = true
  const { response, payload } = await post({
    action: 'shift-create',
    staffId: shiftStaff.value,
    date: shiftDate.value,
    spaceId: shiftSpace.value,
    activity: shiftActivity.value,
    startTime: shiftStart.value,
    endTime: shiftEnd.value,
    notes: shiftNotes.value,
  }, true)
  busy.value = false
  if (!response.ok) {
    error.value = payload.error ?? 'No se pudo asignar la actividad.'
    return
  }
  shiftNotes.value = ''
  notice.value = payload.notice || 'La actividad quedó asignada.'
  await load()
}

async function dropShift(id: string) {
  error.value = ''
  const { response, payload } = await post({ action: 'shift-remove', id }, true)
  if (!response.ok) {
    error.value = payload.error ?? 'No se pudo quitar la actividad.'
    return
  }
  await load()
}

function staffName(id: string) {
  return staff.value.find((item) => item.id === id)?.fullName ?? 'Empleado'
}

function exit() {
  token.value = ''
  sessionUser.value = ''
  sessionStorage.removeItem(TOKEN_KEY)
}

onMounted(() => {
  const saved = sessionStorage.getItem(TOKEN_KEY)
  if (!saved) return
  token.value = saved
  void load()
})
</script>

<template>
  <div v-if="!token" class="admin-gate">
    <div class="narrow">
      <p class="eyebrow">Panel</p>
      <h1 class="block-title">Administración.</h1>
      <p class="lede" style="margin: 1rem 0">El acceso está en Cuenta, con usuario y contraseña.</p>
      <RouterLink class="btn btn-dark" to="/cuenta">Ir a entrar</RouterLink>
      <p v-if="error" class="field-error" role="alert" style="margin-top: 1rem">{{ error }}</p>
    </div>
  </div>
  <div v-else class="admin-app" :class="{ 'is-menu-open': menuOpen }">
    <aside class="admin-side">
      <div class="admin-brand">
        <div>
          <span>Panel</span>
          <strong>Casa</strong>
        </div>
        <button class="admin-menu-toggle" type="button" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
          <X v-if="menuOpen" :size="20" aria-hidden="true" />
          <Menu v-else :size="20" aria-hidden="true" />
          <span class="sr-only">{{ menuOpen ? 'Cerrar menú' : 'Abrir menú' }}</span>
        </button>
      </div>
      <nav class="admin-nav" aria-label="Administración">
        <button v-for="item in menu" :key="item.id" type="button" :aria-current="panel === item.id ? 'page' : undefined" @click="openPanel(item.id)">
          <component :is="item.icon" :size="18" aria-hidden="true" />
          {{ item.label }}
        </button>
      </nav>
      <div class="admin-side-foot">
        <RouterLink to="/">Ver el sitio</RouterLink>
        <button type="button" @click="exit"><LogOut :size="16" aria-hidden="true" /> Cerrar sesión</button>
      </div>
    </aside>
    <div ref="panelMain" class="admin-main">
      <header class="admin-top">
        <div>
          <p class="eyebrow">{{ sessionUser || 'Administración' }}</p>
          <h1>{{ panelTitle }}</h1>
        </div>
      </header>
      <p v-if="error" class="field-error" role="alert">{{ error }}</p>
      <p v-if="notice" class="demo-callout" role="status" style="margin: 0.8rem 0 1rem">{{ readableNotice }}</p>

      <section v-if="panel === 'resumen'">
        <div class="admin-stats">
          <article class="admin-stat"><span class="eyebrow">Vigentes</span><strong>{{ upcoming }}</strong></article>
          <article class="admin-stat"><span class="eyebrow">Confirmadas</span><strong>{{ confirmed }}</strong></article>
          <article class="admin-stat"><span class="eyebrow">Pendientes</span><strong>{{ pending }}</strong></article>
          <article class="admin-stat"><span class="eyebrow">Fechas cerradas</span><strong>{{ closures.length }}</strong></article>
        </div>
        <div class="admin-stats">
          <article class="admin-stat"><span class="eyebrow">Equipo</span><strong>{{ staff.length }}</strong></article>
          <article class="admin-stat"><span class="eyebrow">Actividades</span><strong>{{ shifts.length }}</strong></article>
          <article class="admin-stat"><span class="eyebrow">Solicitudes</span><strong>{{ quotes.length }}</strong></article>
          <article class="admin-stat"><span class="eyebrow">Reservaciones</span><strong>{{ reservations.length }}</strong></article>
        </div>
      </section>

      <section v-else-if="panel === 'equipo'">
        <p class="fine">Crea la cuenta con usuario y contraseña. El empleado entra en Cuenta y ve el día, el espacio y la actividad que le asignes.</p>
        <form class="choice-grid" style="margin: 1rem 0" @submit.prevent="createEmployee">
          <div class="field">
            <label for="empleado-nombre">Nombre</label>
            <input id="empleado-nombre" v-model="employeeName" type="text" autocomplete="off" required />
          </div>
          <div class="field">
            <label for="empleado-usuario">Usuario</label>
            <input id="empleado-usuario" v-model="employeeUser" type="text" autocomplete="off" required minlength="3" />
          </div>
          <div class="field">
            <label for="empleado-clave">Contraseña</label>
            <input id="empleado-clave" v-model="employeePassword" type="password" autocomplete="new-password" required minlength="8" />
          </div>
          <div class="actions" style="align-self: end">
            <button class="btn btn-dark" type="submit" :disabled="busy">Crear cuenta</button>
          </div>
        </form>
        <div v-if="staff.length" class="reservation-list">
          <article v-for="member in staff" :key="member.id" class="reservation-card">
            <header>
              <div>
                <p class="eyebrow">{{ member.username }}</p>
                <h2 style="font-size: 1.7rem">{{ member.fullName }}</h2>
              </div>
              <button class="btn btn-line btn-line-dark" type="button" @click="toggleStaff(member)">{{ member.active ? 'Desactivar' : 'Activar' }}</button>
            </header>
            <p>{{ member.active ? 'Puede entrar.' : 'Cuenta inactiva.' }}</p>
          </article>
        </div>
        <p v-else class="fine">Todavía no hay cuentas de equipo.</p>
      </section>

      <section v-else-if="panel === 'actividades'">
        <form class="choice-grid" style="margin: 0 0 1.4rem" @submit.prevent="assignShift">
          <div class="field">
            <label for="turno-empleado">Empleado</label>
            <select id="turno-empleado" v-model="shiftStaff" required>
              <option value="" disabled>Elige a alguien</option>
              <option v-for="member in staff.filter((item) => item.active)" :key="member.id" :value="member.id">{{ member.fullName }}</option>
            </select>
          </div>
          <div class="field">
            <label for="turno-fecha">Día</label>
            <input id="turno-fecha" v-model="shiftDate" type="date" required />
          </div>
          <div class="field">
            <label for="turno-espacio">Dónde</label>
            <select id="turno-espacio" v-model="shiftSpace" required>
              <option v-for="space in spaces" :key="space.id" :value="space.id">{{ space.name }}</option>
            </select>
          </div>
          <div class="field">
            <label for="turno-actividad">Actividad</label>
            <input id="turno-actividad" v-model="shiftActivity" type="text" required minlength="2" />
          </div>
          <div class="field">
            <label for="turno-entrada">Entrada</label>
            <input id="turno-entrada" v-model="shiftStart" type="time" required />
          </div>
          <div class="field">
            <label for="turno-salida">Salida</label>
            <input id="turno-salida" v-model="shiftEnd" type="time" required />
          </div>
          <div class="field" style="grid-column: 1 / -1">
            <label for="turno-notas">Notas</label>
            <input id="turno-notas" v-model="shiftNotes" type="text" />
          </div>
          <div class="actions" style="grid-column: 1 / -1">
            <button class="btn btn-dark" type="submit" :disabled="busy || staff.length === 0">Asignar</button>
          </div>
        </form>
        <div v-if="shifts.length" class="reservation-list">
          <article v-for="item in shifts" :key="item.id" class="reservation-card">
            <header>
              <div>
                <p class="eyebrow">{{ formatLongDate(item.date) }} · {{ item.startTime }} a {{ item.endTime }}</p>
                <h2 style="font-size: 1.7rem">{{ staffName(item.staffId) }}</h2>
              </div>
              <button class="btn btn-line btn-line-dark" type="button" @click="dropShift(item.id)">Quitar</button>
            </header>
            <p>{{ item.activity }} · {{ spaceLabel(item.spaceId) }}</p>
            <p v-if="item.notes">{{ item.notes }}</p>
          </article>
        </div>
        <p v-else class="fine">Todavía no hay actividades asignadas.</p>
      </section>

      <section v-else-if="panel === 'fechas'">
        <p class="fine">Úsalo cuando el día ya se ocupó por otro medio. Ese día deja de ofrecerse en la reserva.</p>
        <form class="choice-grid" style="margin: 1rem 0 1.4rem" @submit.prevent="closeDay">
          <div class="field">
            <label for="cierre-fecha">Fecha</label>
            <input id="cierre-fecha" v-model="closeDate" type="date" required />
          </div>
          <div class="field">
            <label for="cierre-espacio">Espacio</label>
            <select id="cierre-espacio" v-model="closeSpace">
              <option value="">Todos los espacios</option>
              <option v-for="space in spaces" :key="space.id" :value="space.id">{{ space.name }}</option>
            </select>
          </div>
          <div class="field" style="grid-column: 1 / -1">
            <label for="cierre-motivo">Motivo</label>
            <input id="cierre-motivo" v-model="closeReason" type="text" required minlength="3" placeholder="Cerrado por un evento externo" />
          </div>
          <div class="actions" style="grid-column: 1 / -1">
            <button class="btn btn-dark" type="submit" :disabled="busy">Cerrar fecha</button>
          </div>
        </form>
        <div v-if="closures.length" class="reservation-list">
          <article v-for="item in closures" :key="item.id" class="reservation-card">
            <header>
              <div>
                <p class="eyebrow">{{ formatLongDate(item.date) }}</p>
                <h2 style="font-size: 1.7rem">{{ spaceLabel(item.spaceId) }}</h2>
              </div>
              <button class="btn btn-line btn-line-dark" type="button" @click="reopen(item.id)">Abrir fecha</button>
            </header>
            <p>{{ item.reason }}</p>
          </article>
        </div>
        <p v-else class="fine">No hay fechas cerradas.</p>
      </section>

      <section v-else-if="panel === 'reservaciones'">
        <p v-if="ordered.length === 0" class="fine">Todavía no hay reservaciones guardadas en la nube.</p>
        <div v-else class="reservation-list">
          <article v-for="item in ordered" :key="item.id" class="reservation-card">
            <header>
              <div>
                <p class="eyebrow">{{ item.folio }}</p>
                <h2 style="font-size: 2rem">{{ item.client.fullName }}</h2>
              </div>
              <span class="badge">{{ statusLabels[item.status] }}</span>
            </header>
            <p>{{ reservationSpaceName(item) }} · {{ reservationEventLabel(item) }}</p>
            <p>{{ formatLongDate(item.date) }} · {{ formatTimeRange(item.startTime, item.endTime) }} · {{ item.guests }} invitados</p>
            <p>{{ item.client.email }} · {{ item.client.phone }}</p>
            <p v-if="item.client.notes">{{ item.client.notes }}</p>
            <p v-if="item.pricing.totalMxn"><strong>{{ formatMxn(item.pricing.totalMxn) }}</strong></p>
            <PriceBreakdown v-if="item.pricing.lines.length" :quote="item.pricing" :notice="false" />
            <div class="actions">
              <button v-if="item.status !== 'confirmada'" class="btn btn-dark" type="button" :disabled="busy" @click="setStatus(item.id, 'confirmada')">Marcar confirmada</button>
              <button v-if="item.status !== 'pendiente'" class="btn btn-line btn-line-dark" type="button" :disabled="busy" @click="setStatus(item.id, 'pendiente')">Dejar pendiente</button>
              <button v-if="item.status !== 'cancelada'" class="btn btn-line btn-line-dark" type="button" :disabled="busy" @click="setStatus(item.id, 'cancelada')">Cancelar y liberar</button>
            </div>
          </article>
        </div>
      </section>

      <section v-else>
        <div v-if="quotes.length" class="reservation-list">
          <article v-for="item in quotes" :key="item.id" class="reservation-card">
            <header>
              <h2 style="font-size: 1.7rem">{{ item.name }}</h2>
              <span class="badge">{{ item.email }}</span>
            </header>
            <p>{{ item.phone }} <span v-if="item.tentativeDate">· {{ item.tentativeDate }}</span> <span v-if="item.guests">· {{ item.guests }} invitados</span></p>
            <p>{{ item.message }}</p>
          </article>
        </div>
        <p v-else class="fine">No hay solicitudes nuevas.</p>
      </section>
    </div>
  </div>
</template>
