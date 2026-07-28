const CACHE_VERSION = "casa-perea-v4";
const TILE_CACHE = "casa-perea-tiles-v1";
const CURRENT_CACHES = [CACHE_VERSION, TILE_CACHE];

const OFFLINE_URL = "/offline";
const APP_SHELL = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !CURRENT_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Nunca interceptar peticiones a Supabase (auth/API): deben ir siempre a
// red y ser gestionadas por la app (que tiene su propia cola offline en
// IndexedDB), no cacheadas por el service worker.
function isSupabaseRequest(url) {
  return /supabase\.co$/.test(url.hostname) || /supabase\.in$/.test(url.hostname);
}

// Teselas del mapa satélite (Esri World Imagery): cada URL identifica una
// tesela concreta (z/y/x) cuyo contenido no cambia, así que cachearlas
// agresivamente permite ver el mapa de zonas ya visitadas sin cobertura.
function isMapTileRequest(url) {
  return /\.arcgisonline\.com$/.test(url.hostname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (isMapTileRequest(url)) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        // Las teselas cruzan de origen sin CORS, así que llegan como
        // respuestas "opacas" (response.ok siempre false ahí) — se cachean
        // igual, es el comportamiento esperado para peticiones de imagen.
        if (response.ok || response.type === "opaque") {
          cache.put(request, response.clone());
        }
        return response;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return; // incluye Supabase y otros orígenes
  if (isSupabaseRequest(url)) return;

  // Navegaciones: red primero, con fallback a caché y luego a /offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(
          async () =>
            (await caches.match(request)) ||
            (await caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Resto de assets propios: caché primero, con actualización en segundo plano.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
