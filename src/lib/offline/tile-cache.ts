// Descarga proactiva de teselas del mapa de satélite para verlas sin
// conexión, guardándolas en la misma caché que usa el service worker
// (public/sw.js) para servirlas cuando no hay red.

// Debe coincidir exactamente con TILE_CACHE en public/sw.js.
const TILE_CACHE = "casa-perea-tiles-v1";

export interface TileCoord {
  z: number;
  x: number;
  y: number;
}

export interface AreaGeografica {
  north: number;
  south: number;
  east: number;
  west: number;
}

function lngATileX(lng: number, z: number): number {
  return Math.floor(((lng + 180) / 360) * 2 ** z);
}

function latATileY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z
  );
}

export function tilesParaArea(area: AreaGeografica, zMin: number, zMax: number): TileCoord[] {
  const tiles: TileCoord[] = [];
  for (let z = zMin; z <= zMax; z++) {
    const xMin = lngATileX(area.west, z);
    const xMax = lngATileX(area.east, z);
    const yMin = latATileY(area.north, z);
    const yMax = latATileY(area.south, z);
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        tiles.push({ z, x, y });
      }
    }
  }
  return tiles;
}

function urlDeTesela(plantilla: string, tile: TileCoord): string {
  return plantilla
    .replace("{z}", String(tile.z))
    .replace("{y}", String(tile.y))
    .replace("{x}", String(tile.x));
}

export interface ProgresoDescarga {
  hechas: number;
  total: number;
  fallidas: number;
}

const CONCURRENCIA = 6;

// Descarga las teselas con concurrencia limitada. Las que ya estén en
// caché (de una descarga anterior, o de haber visitado esa zona con
// cobertura) no se vuelven a pedir.
export async function descargarTeselas(
  plantilla: string,
  tiles: TileCoord[],
  onProgreso: (p: ProgresoDescarga) => void,
  senal: AbortSignal
): Promise<ProgresoDescarga> {
  const cache = await caches.open(TILE_CACHE);
  let hechas = 0;
  let fallidas = 0;
  let indice = 0;

  async function siguiente(): Promise<void> {
    while (indice < tiles.length && !senal.aborted) {
      const tile = tiles[indice++];
      const url = urlDeTesela(plantilla, tile);
      try {
        const yaEsta = await cache.match(url);
        if (!yaEsta) {
          // Las teselas de Esri no llevan cabeceras CORS: en modo "no-cors"
          // llegan como respuesta "opaca" (sin poder leer su estado real),
          // pero se pueden cachear igual — el propio service worker hace
          // lo mismo al servirlas la primera vez.
          const respuesta = await fetch(url, { mode: "no-cors", signal: senal });
          if (respuesta.type === "opaque" || respuesta.ok) {
            await cache.put(url, respuesta);
          } else {
            fallidas++;
          }
        }
      } catch {
        if (!senal.aborted) fallidas++;
      }
      hechas++;
      onProgreso({ hechas, total: tiles.length, fallidas });
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCIA, tiles.length) }, () => siguiente())
  );
  return { hechas, total: tiles.length, fallidas };
}
