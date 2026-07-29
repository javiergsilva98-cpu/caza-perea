import { useEffect, useRef, useState } from "react";
import L from "leaflet";

// Marcador "estás aquí" + círculo de precisión, con seguimiento continuo
// (watch) mientras está activo. Aislado del resto del mapa: solo necesita
// la instancia de Leaflet, no toca linde ni puntos/capturas.
export function useGpsLocation(map: L.Map | null) {
  const markerRef = useRef<L.CircleMarker | null>(null);
  const circuloRef = useRef<L.Circle | null>(null);
  const [siguiendo, setSiguiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!map) return;
    const mapaInstance = map;

    function onLocationFound(e: L.LocationEvent) {
      setError(null);
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        markerRef.current = L.circleMarker(e.latlng, {
          radius: 8,
          color: "#fff",
          weight: 2,
          fillColor: "#2b7de9",
          fillOpacity: 1,
        }).addTo(mapaInstance);
      }
      if (circuloRef.current) {
        circuloRef.current.setLatLng(e.latlng).setRadius(e.accuracy);
      } else {
        circuloRef.current = L.circle(e.latlng, {
          radius: e.accuracy,
          color: "#2b7de9",
          weight: 1,
          fillOpacity: 0.1,
        }).addTo(mapaInstance);
      }
    }

    function onLocationError(e: L.ErrorEvent) {
      setSiguiendo(false);
      setError(
        e.code === 1
          ? "Permiso de ubicación denegado. Actívalo en los ajustes del navegador."
          : "No se ha podido obtener tu ubicación."
      );
    }

    mapaInstance.on("locationfound", onLocationFound);
    mapaInstance.on("locationerror", onLocationError);
    return () => {
      mapaInstance.off("locationfound", onLocationFound);
      mapaInstance.off("locationerror", onLocationError);
    };
  }, [map]);

  function toggle() {
    if (!map) return;
    if (siguiendo) {
      map.stopLocate();
      markerRef.current?.remove();
      markerRef.current = null;
      circuloRef.current?.remove();
      circuloRef.current = null;
      setSiguiendo(false);
    } else {
      setError(null);
      map.locate({ setView: true, maxZoom: 17, watch: true, enableHighAccuracy: true });
      setSiguiendo(true);
    }
  }

  return { siguiendo, error, toggle, dismissError: () => setError(null) };
}
