import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/espacios', name: 'spaces', component: () => import('@/views/SpacesView.vue') },
    { path: '/espacios/:slug', name: 'space', component: () => import('@/views/SpaceDetailView.vue') },
    { path: '/catering', name: 'catering', component: () => import('@/views/CateringView.vue') },
    { path: '/reservar', name: 'booking', component: () => import('@/views/BookingView.vue') },
    { path: '/reservacion/:folio', name: 'confirmation', component: () => import('@/views/ConfirmationView.vue') },
    { path: '/reservaciones', name: 'reservations', component: () => import('@/views/ReservationsView.vue') },
    { path: '/nosotros', name: 'about', component: () => import('@/views/AboutView.vue') },
    { path: '/contacto', name: 'contact', component: () => import('@/views/ContactView.vue') },
    { path: '/cuenta', name: 'account', component: () => import('@/views/AccountView.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
  ],
})

export default router
