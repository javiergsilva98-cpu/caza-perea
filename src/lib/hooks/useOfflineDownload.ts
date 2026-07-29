import { useRef, useState } from "react";
import L from "leaflet";
import {
  tilesParaArea,
  descargarTeselas,
  type ProgresoDescarga,
  type TileCoord,
} from "@/lib/offline/tile-cache";

export type EstadoDescarga = "confirmar" | "descargando" | "completa" | "demasiado_grande" | null;

// Descarga de teselas de la zona visible del mapa para uso sin conexión.
// Aislado del resto del mapa: solo lee los límites/zoom actuales, no toca
// linde ni puntos/capturas.
export function useOfflineDownload(map: L.Map | null, tileUrlTemplate: string) {
  const abortRef = useRef<AbortController | null>(null);
  const [estado, setEstado] = useState<EstadoDescarga>(null);
  const [tiles, setTiles] = useState<TileCoord[]>([]);
  const [progreso, setProgreso] = useState<ProgresoDescarga | null>(null);

  function abrir() {
    if (!map) return;
    const bounds = map.getBounds();
    const zoomActual = Math.round(map.getZoom());
    const zMin = Math.max(zoomActual - 1, 10);
    const zMax = Math.min(zoomActual + 2, 18);
    const tilesArea = tilesParaArea(
      {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      },
      zMin,
      zMax
    );
    setTiles(tilesArea);
    setProgreso(null);
    setEstado(tilesArea.length > 4000 ? "demasiado_grande" : "confirmar");
  }

  async function confirmar() {
    setEstado("descargando");
    const controller = new AbortController();
    abortRef.current = controller;
    const resultado = await descargarTeselas(
      tileUrlTemplate,
      tiles,
      (p) => setProgreso(p),
      controller.signal
    );
    if (!controller.signal.aborted) {
      setProgreso(resultado);
      setEstado("completa");
    }
  }

  function cancelar() {
    abortRef.current?.abort();
    setEstado(null);
  }

  function cerrar() {
    setEstado(null);
  }

  return { estado, tiles, progreso, abrir, confirmar, cancelar, cerrar };
}
