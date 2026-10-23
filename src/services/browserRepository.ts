import { createDemoStore, resolveBrowserStorage } from '@/services/demoStore'
import { createQuotesService } from '@/services/quotesService'
import { createReservationsService } from '@/services/reservationsService'

export const appDemoStore = createDemoStore(resolveBrowserStorage())
export const reservationsService = createReservationsService(appDemoStore)
export const quotesService = createQuotesService(appDemoStore)
