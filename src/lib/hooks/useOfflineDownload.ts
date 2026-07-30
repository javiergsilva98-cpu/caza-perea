import { useCallback, useRef, useState } from "react";
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

  // Memoizadas: "abrir" viaja como MapTools.descargarZona a través del
  // contexto compartido con AppNav (ver map-tools-context.tsx). El efecto de
  // FincaMap que registra las herramientas depende de esta referencia — sin
  // useCallback se recrea en cada render, el efecto se dispara de nuevo,
  // vuelve a registrar las herramientas, eso repinta FincaMap (consume el
  // mismo contexto) y se entra en un bucle infinito de renders.
  const abrir = useCallback(() => {
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
  }, [map]);

  const confirmar = useCallback(async () => {
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
  }, [tileUrlTemplate, tiles]);

  const cancelar = useCallback(() => {
    abortRef.current?.abort();
    setEstado(null);
  }, []);

  const cerrar = useCallback(() => {
    setEstado(null);
  }, []);

  return { estado, tiles, progreso, abrir, confirmar, cancelar, cerrar };
}
