# Casa Perea — Coto CU10053

App interna de gestión del coto de caza CU10053 (Cuenca) para Casa Perea.
Mobile-first, instalable como PWA y pensada para funcionar sin cobertura en
la finca (offline-first).

## Stack

- **Frontend**: Next.js 16 (App Router, TypeScript), Tailwind CSS v4, PWA
  (manifest + service worker).
- **Backend**: Supabase (Postgres + Auth + Row Level Security).
- **Despliegue**: Vercel, deploy automático en cada push a `main`.
- **Mapa** (a partir del Sprint 1): Leaflet + Leaflet-geoman, capa satélite
  Esri World Imagery.

## Estructura del proyecto

```
src/
  app/
    layout.tsx          # layout raíz: fuentes, metadata PWA, viewport, registra el SW
    manifest.ts          # genera /manifest.webmanifest
    login/                # pantalla de login (fuera del grupo autenticado)
    offline/              # página de fallback offline que sirve el service worker
    (app)/                # grupo de rutas autenticadas (requiere sesión)
      layout.tsx           # cabecera + nav inferior, redirige a /login si no hay sesión
      page.tsx              # inicio
      mapa/                 # placeholder — Sprint 1
      capturas/             # placeholder — sprint futuro
      actividades/          # placeholder — sprint futuro
      perfil/               # datos del usuario + cerrar sesión
  components/
    BottomNav.tsx          # navegación inferior (5 secciones)
    ServiceWorkerRegister.tsx
    ComingSoon.tsx
  lib/supabase/
    client.ts              # cliente Supabase para Client Components
    server.ts               # cliente Supabase para Server Components/Actions (cookies)
    proxy.ts                 # refresco de sesión + protección de rutas (usado por src/proxy.ts)
    database.types.ts         # tipos TS del esquema (mantenidos a mano)
  proxy.ts                # Proxy de Next.js (antes "middleware"): llama a lib/supabase/proxy
public/
  sw.js                  # service worker: cachea el app shell, navegación offline
  icons/                  # iconos PWA (placeholder, sustituir por los definitivos)
supabase/
  migrations/             # SQL versionado del esquema
  README.md               # cómo aplicar el esquema y dar de alta usuarios
```

### Por qué `proxy.ts` y no `middleware.ts`

Next.js 16 renombró el fichero `middleware` a `proxy` (mismo mecanismo,
nuevo nombre). Si ves referencias a "middleware" en docs de Supabase u otros
tutoriales, el equivalente en este proyecto es `src/proxy.ts`.

## Modelo de datos (Supabase)

- `usuarios`: perfil (nombre, rol `admin`/`cazador`) 1-a-1 con `auth.users`.
  Se crea automáticamente vía trigger al dar de alta un usuario en Auth.
- `puntos_interes`: comederos, bebederos, puestos, etc. (lat/lng, notas, foto).
- `finca_limite`: historial de versiones de la linde (GeoJSON) — cada
  edición inserta una fila nueva; `finca_limite_actual` expone la vigente.

RLS activada en las tres tablas — detalle completo de las policies en
`supabase/migrations/20260728000000_init_schema.sql`. Ver `supabase/README.md`
para cómo aplicar el esquema y dar de alta a los tres usuarios iniciales.

Tablas previstas para sprints futuros (no creadas todavía, pero tenidas en
cuenta en el diseño para no romper nada): `capturas_avistamientos`, `gastos`,
`actividades`.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # rellena con las claves de tu proyecto Supabase
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Para probar la
instalación como PWA y el service worker hace falta HTTPS o `localhost`
(ambos válidos como "contextos seguros").

## Despliegue (Vercel)

1. Importa el repo de GitHub en Vercel — el framework preset `Next.js` se
   detecta solo.
2. Añade las variables de entorno `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` (Production,
   Preview y Development) con los valores de Supabase → Project Settings →
   API. La última es solo para el servidor (nunca `NEXT_PUBLIC_`) y hace
   falta para poder invitar cazadores desde la app.
3. Cada push a `main` despliega automáticamente.

## Autenticación

- Login con email + contraseña (Supabase Auth). No hay registro público: un
  admin invita a cada cazador desde Perfil → "+ Invitar cazador" (crea la
  cuenta con una contraseña temporal que se le pasa a mano). El primer
  usuario (el primer admin) se crea y se promociona a mano desde el
  dashboard de Supabase — ver `supabase/README.md`.
- Roles: `admin` (gestión completa, incluida la invitación de más usuarios)
  y `cazador` (acceso simple).
- `src/proxy.ts` protege todas las rutas salvo `/login` y los assets de la
  PWA, redirigiendo a `/login` si no hay sesión.

## Offline / PWA

- `src/app/manifest.ts` genera el manifest (instalable en pantalla de
  inicio, `display: standalone`).
- `public/sw.js` cachea el app shell (rutas, iconos, manifest) y sirve
  `/offline` como fallback de navegación sin conexión. Las peticiones a
  Supabase nunca se cachean en el service worker — la sincronización
  offline-first de datos (crear/editar sin conexión) es trabajo del
  Sprint 1 en adelante, no de esta base de infraestructura.
- Iconos en `public/icons/` son un placeholder generado (verde + "CP");
  sustitúyelos por los definitivos cuando haya un logo.

## Próximos pasos (Sprint 1)

1. Mapa interactivo (Leaflet + Esri World Imagery) con los `puntos_interes`
   y edición de la linde (`finca_limite`) con Leaflet-geoman.
2. Estrategia offline-first real para crear/editar datos sin conexión
   (cola de sincronización, ej. con IndexedDB) contra Supabase.
3. Registro de capturas y avistamientos.
4. Registro de actividades/recordatorios de mantenimiento.
5. Gestión de esperas/puestos (asignación y rotación).
