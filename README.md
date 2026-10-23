# DiverxoDacosta

Casa de catering, banquetes y renta de espacios. Teléfono 435 103 6808. Correo hola@diverxodacosta.com. Ciudad de México. Horario de lunes a sábado, de 10:00 a 19:00.

El repositorio `https://github.com/sorenseph/DiverxoDacosta.git` no estaba disponible al iniciar el proyecto, así que la aplicación se creó en local.

## Vercel

El proyecto es un sitio Vite. `vercel.json` reescribe las rutas de la aplicación hacia `index.html` y deja `/api` para el correo y las reservaciones.

En el proyecto de Vercel hay que definir, sin subirlas al repositorio:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (clave publicable)
- `SUPABASE_SECRET_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM`

El esquema de usuarios, reservaciones y cotizaciones está en `supabase/migrations`. Hay que ejecutarlo en el editor SQL de Supabase antes de guardar reservaciones reales. Las tablas usan el prefijo `diverxo_` para no mezclarse con otras del mismo proyecto.

Resend no acepta `gmail.com` como dominio del remitente hasta verificar un dominio propio en [resend.com/domains](https://resend.com/domains). Mientras tanto, si ese envío falla, el servidor reintenta con el remitente de prueba `onboarding@resend.dev` y deja `reply_to` en israelcardenas6@gmail.com. Ese remitente de prueba solo entrega al correo de la cuenta de Resend.

## Requisitos

- Node.js 22 o superior

## Ejecutar

```bash
npm install
npm run dev
```

La aplicación abre el servidor de Vite. Otras órdenes:

```bash
npm test
npm run build
npm run preview
```

## Recorrido

1. En Espacios, filtra por tipo, invitados, presupuesto, fecha y disponibilidad.
2. En Planear evento, completa los seis pasos y envía la solicitud.
3. En Reservaciones, consulta el folio o cancela para liberar el horario.

Fechas con agenda:

- Salón, 14 de noviembre de 2026, 15:00 a 19:00. Un evento de 19:00 a 21:00 sí cabe, porque ese espacio no pide tiempo extra entre eventos.
- Salón principal, el mismo día, 09:00 a 14:00. El siguiente evento puede empezar a las 14:30, porque reserva 30 minutos de transición.
- Jardín, 5 de diciembre de 2026, 13:00 a 18:00.
- Terraza, 28 de noviembre de 2026, 18:00 a 23:00.

Las rentas y los paquetes están en `src/data/spaces.ts`, `src/data/cateringPackages.ts` y `src/data/additionalServices.ts`. Una reservación ya guardada conserva el desglose con el que se confirmó.

Dos espacios distintos pueden ocuparse a la misma hora.

## Recuperar la agenda

En **Reservaciones**, usa **Recuperar agenda**. Eso borra la clave `diverxo-dacosta.v3` de `localStorage` y vuelve a cargar las reservaciones de la casa. También puedes hacerlo desde las herramientas del navegador eliminando esa clave.

El avance del asistente se guarda aparte, en `sessionStorage` (`diverxo-dacosta.booking.v1`), y se limpia al confirmar.

`localStorage` solo existe en este navegador y en este dispositivo. No comparte la disponibilidad con otra persona.

## Arquitectura

- Vue 3, TypeScript, Vite, Vue Router y Pinia.
- Los datos de catálogo viven en `src/data`.
- La disponibilidad, los precios y la validación están en `src/services` y no en las plantillas.
- `checkAvailability(spaceId, date, startTime, endTime)` devuelve un resultado tipado.
- `src/services/demoStore.ts` es el puerto de persistencia. Hoy usa `localStorage`; más adelante puede sustituirse por Supabase o una API sin rehacer la interfaz, siempre que se respete `DemoStore`.

El contacto está concentrado en `src/data/site.ts`. El logotipo es `public/logoDiverxoDacosta.png` y el favicon es `public/ico.jpeg`.

Los videos viven en `public/videos`. El inicio los usa como fondo del hero, de la sección gastronómica y de una tira de cocina. Si el sistema pide menos movimiento, el sitio muestra el fotograma fijo y no reproduce el video.

El título, la descripción, la URL canónica y los datos estructurados se actualizan en cada página desde `src/composables/usePageMeta.ts`. `public/robots.txt` deja fuera las reservaciones. Cuando exista un dominio de producción, conviene publicar un sitemap con las URLs absolutas.
