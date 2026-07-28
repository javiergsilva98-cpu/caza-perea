export interface Coords {
  lat: number;
  lng: number;
}

function coordsValidas(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

// Busca coordenadas en una URL de Google Maps ya resuelta (sin acortar),
// probando los formatos habituales de más a menos precisos.
export function extraerCoordsDeUrlGoogleMaps(url: string): Coords | null {
  const patrones = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // ficha de sitio con pin exacto
    /@(-?\d+\.\d+),(-?\d+\.\d+)/, // centro del mapa en la URL
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/, // parámetro q=lat,lng
    /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/, // parámetro ll=lat,lng (formato antiguo)
  ];
  for (const patron of patrones) {
    const m = url.match(patron);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (coordsValidas(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

const ALLOWED_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "maps.google.com",
  "maps.google.es",
  "www.google.com",
  "google.com",
]);

export function esUrlGoogleMapsPermitida(raw: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  if (!ALLOWED_HOSTS.has(parsed.hostname)) return null;
  return parsed;
}

function dmsADecimal(deg: number, min: number, sec: number, hemisferio: string): number {
  const valor = deg + min / 60 + sec / 3600;
  return /[SW]/i.test(hemisferio) ? -valor : valor;
}

// "39°38'16.1"N 2°51'22.8"W" (con o sin comas/espacios variables)
export function parseDMS(texto: string): Coords | null {
  const re = /(\d{1,3})\s*°\s*(\d{1,2})\s*['′]\s*([\d.]+)\s*["″]?\s*([NSEW])/gi;
  const matches = [...texto.matchAll(re)];
  const lat = matches.find((m) => /[NS]/i.test(m[4]));
  const lng = matches.find((m) => /[EW]/i.test(m[4]));
  if (!lat || !lng) return null;
  const coords = {
    lat: dmsADecimal(Number(lat[1]), Number(lat[2]), Number(lat[3]), lat[4]),
    lng: dmsADecimal(Number(lng[1]), Number(lng[2]), Number(lng[3]), lng[4]),
  };
  return coordsValidas(coords.lat, coords.lng) ? coords : null;
}

// "39.6375, -2.8563"
export function parseDecimal(texto: string): Coords | null {
  const m = texto.match(/(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return coordsValidas(lat, lng) ? { lat, lng } : null;
}

export function pareceUrl(texto: string): boolean {
  return /^https?:\/\//i.test(texto.trim());
}
