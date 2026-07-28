"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { FINCA_CENTER, FINCA_DEFAULT_ZOOM } from "@/lib/constants";
import {
  listPuntosInteres,
  crearPuntoInteres,
  editarPuntoInteres,
  borrarPuntoInteres,
} from "@/lib/data/puntos-interes";
import { getFincaLimiteActual, guardarFincaLimite } from "@/lib/data/finca-limite";
import { listCapturas, crearCaptura, borrarCaptura } from "@/lib/data/capturas";
import { crearActividad } from "@/lib/data/actividades";
import { listUsuariosNombres } from "@/lib/data/usuarios";
import { startSyncTriggers } from "@/lib/sync/sync-manager";
import { createClient } from "@/lib/supabase/client";
import type { CapturaRow, PuntoInteresRow } from "@/lib/offline/db";
import type { Json } from "@/lib/supabase/database.types";
import { iconoCaptura, iconoPunto } from "./icons";
import { PuntoForm, type PuntoFormValues } from "./PuntoForm";
import { SyncBadge } from "./SyncBadge";
import { CapturaForm, type CapturaFormValues } from "@/components/capturas/CapturaForm";
import { CapturaDetail } from "@/components/capturas/CapturaDetail";
import { ActividadForm, type ActividadFormValues } from "@/components/actividades/ActividadForm";

interface PuntoFormState {
  modo: "crear" | "editar";
  lat: number;
  lng: number;
  punto?: PuntoInteresRow;
}

type ModoColocar = "punto" | "captura" | null;

const ESRI_IMAGERY_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_ATTRIBUTION =
  "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, GIS User Community";

export function FincaMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map());
  const puntosRef = useRef<globalThis.Map<string, PuntoInteresRow>>(new globalThis.Map());
  const capturaMarkersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map());
  const capturasRef = useRef<globalThis.Map<string, CapturaRow>>(new globalThis.Map());
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const modoRef = useRef<ModoColocar>(null);

  const [modoColocar, setModoColocar] = useState<ModoColocar>(null);
  const [editingBoundary, setEditingBoundary] = useState(false);
  const [puntoFormState, setPuntoFormState] = useState<PuntoFormState | null>(null);
  const [capturaCrearEn, setCapturaCrearEn] = useState<{ lat: number; lng: number } | null>(null);
  const [capturaDetalle, setCapturaDetalle] = useState<CapturaRow | null>(null);
  const [actividadPuntoId, setActividadPuntoId] = useState<string | null>(null);
  const [puntosLista, setPuntosLista] = useState<PuntoInteresRow[]>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    modoRef.current = modoColocar;
  }, [modoColocar]);

  function renderBoundary(geometria: Json) {
    const map = mapRef.current;
    if (!map) return;
    boundaryLayerRef.current?.remove();
    const layer = L.geoJSON(geometria as unknown as GeoJSON.GeoJsonObject, {
      style: { color: "#facc15", weight: 3, fillOpacity: 0.08 },
    });
    layer.addTo(map);
    boundaryLayerRef.current = layer;
  }

  function addOrUpdateMarker(p: PuntoInteresRow) {
    const map = mapRef.current;
    if (!map) return;
    puntosRef.current.set(p.id, p);
    setPuntosLista(Array.from(puntosRef.current.values()));
    const existing = markersRef.current.get(p.id);
    if (existing) {
      existing.setLatLng([p.lat, p.lng]);
      existing.setIcon(iconoPunto(p.tipo));
      return;
    }
    const marker = L.marker([p.lat, p.lng], { icon: iconoPunto(p.tipo) });
    marker.on("click", () => {
      const actual = puntosRef.current.get(p.id);
      if (!actual) return;
      setPuntoFormState({ modo: "editar", lat: actual.lat, lng: actual.lng, punto: actual });
    });
    marker.addTo(map);
    markersRef.current.set(p.id, marker);
  }

  function removeMarker(id: string) {
    markersRef.current.get(id)?.remove();
    markersRef.current.delete(id);
    puntosRef.current.delete(id);
    setPuntosLista(Array.from(puntosRef.current.values()));
  }

  function addOrUpdateCapturaMarker(c: CapturaRow) {
    const map = mapRef.current;
    if (!map || c.lat === null || c.lng === null) return;
    capturasRef.current.set(c.id, c);
    const existing = capturaMarkersRef.current.get(c.id);
    if (existing) {
      existing.setLatLng([c.lat, c.lng]);
      return;
    }
    const marker = L.marker([c.lat, c.lng], { icon: iconoCaptura(c.tipo) });
    marker.on("click", () => {
      const actual = capturasRef.current.get(c.id);
      if (actual) setCapturaDetalle(actual);
    });
    marker.addTo(map);
    capturaMarkersRef.current.set(c.id, marker);
  }

  function removeCapturaMarker(id: string) {
    capturaMarkersRef.current.get(id)?.remove();
    capturaMarkersRef.current.delete(id);
    capturasRef.current.delete(id);
  }

  // Inicializa el mapa una sola vez.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: FINCA_CENTER,
      zoom: FINCA_DEFAULT_ZOOM,
      zoomControl: false,
    });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer(ESRI_IMAGERY_URL, { maxZoom: 19, attribution: ESRI_ATTRIBUTION }).addTo(map);
    // Quita el "Leaflet | 🇺🇦" que añade Leaflet por defecto — dejamos solo
    // el crédito de Esri, obligatorio por las condiciones de uso gratuito.
    map.attributionControl.setPrefix(false);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const modo = modoRef.current;
      if (modo === "punto") {
        setPuntoFormState({ modo: "crear", lat: e.latlng.lat, lng: e.latlng.lng });
        setModoColocar(null);
      } else if (modo === "captura") {
        setCapturaCrearEn({ lat: e.latlng.lat, lng: e.latlng.lng });
        setModoColocar(null);
      }
    });

    map.on("pm:create", (e) => {
      map.pm.disableDraw("Polygon");
      const drawn = e.layer as L.Polygon;
      const geojson = drawn.toGeoJSON();
      drawn.remove();
      setEditingBoundary(false);
      renderBoundary(geojson as unknown as Json);
      void guardarFincaLimite(geojson as unknown as Json);
    });

    mapRef.current = map;
    startSyncTriggers();

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Carga inicial de datos (puntos, linde, capturas), con caché offline.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [puntos, limite, capturas, nombresMap] = await Promise.all([
        listPuntosInteres(),
        getFincaLimiteActual(),
        listCapturas(),
        listUsuariosNombres(),
      ]);
      if (cancelled) return;
      puntos.forEach(addOrUpdateMarker);
      if (limite) renderBoundary(limite.geometria);
      capturas.forEach(addOrUpdateCapturaMarker);
      setNombres(nombresMap);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Usuario actual + rol, para decidir qué puede editar/borrar.
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      const { data } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", session.user.id)
        .maybeSingle();
      setIsAdmin(data?.rol === "admin");
    })();
  }, []);

  function toggleModoColocar(modo: "punto" | "captura") {
    setModoColocar((actual) => (actual === modo ? null : modo));
  }

  function toggleBoundaryEdit() {
    const map = mapRef.current;
    if (!map) return;

    if (!editingBoundary) {
      setEditingBoundary(true);
      const layer = boundaryLayerRef.current;
      if (layer) {
        layer.eachLayer?.((sub) => (sub as L.Polygon).pm?.enable({ allowSelfIntersection: false }));
      } else {
        map.pm.enableDraw("Polygon", { finishOn: "dblclick", allowSelfIntersection: false });
      }
      return;
    }

    setEditingBoundary(false);
    const layer = boundaryLayerRef.current;
    if (layer) {
      const geoJsonLayers: GeoJSON.Feature[] = [];
      layer.eachLayer?.((sub) => {
        (sub as L.Polygon).pm?.disable();
        geoJsonLayers.push((sub as L.Polygon).toGeoJSON());
      });
      const geometria =
        geoJsonLayers.length === 1 ? geoJsonLayers[0] : { type: "FeatureCollection", features: geoJsonLayers };
      void guardarFincaLimite(geometria as unknown as Json);
    } else {
      map.pm.disableDraw("Polygon");
    }
  }

  async function handlePuntoSubmit(values: PuntoFormValues) {
    if (!puntoFormState) return;
    if (puntoFormState.modo === "crear") {
      const row = await crearPuntoInteres({
        nombre: values.nombre,
        tipo: values.tipo,
        notas: values.notas,
        lat: puntoFormState.lat,
        lng: puntoFormState.lng,
      });
      addOrUpdateMarker(row);
    } else if (puntoFormState.punto) {
      await editarPuntoInteres(puntoFormState.punto.id, values);
      addOrUpdateMarker({ ...puntoFormState.punto, ...values });
    }
    setPuntoFormState(null);
  }

  async function handlePuntoDelete() {
    if (!puntoFormState?.punto) return;
    await borrarPuntoInteres(puntoFormState.punto.id);
    removeMarker(puntoFormState.punto.id);
    setPuntoFormState(null);
  }

  async function handleCapturaSubmit(values: CapturaFormValues) {
    if (!capturaCrearEn) return;
    const row = await crearCaptura({ ...values, lat: capturaCrearEn.lat, lng: capturaCrearEn.lng });
    addOrUpdateCapturaMarker(row);
    setCapturaCrearEn(null);
  }

  async function handleCapturaDelete() {
    if (!capturaDetalle) return;
    await borrarCaptura(capturaDetalle.id);
    removeCapturaMarker(capturaDetalle.id);
    setCapturaDetalle(null);
  }

  async function handleActividadSubmit(values: ActividadFormValues) {
    await crearActividad(values);
    setActividadPuntoId(null);
  }

  const puedeEditarPunto =
    puntoFormState?.modo === "crear" ||
    (!!puntoFormState?.punto && (puntoFormState.punto.creado_por === userId || isAdmin));

  const puntoEnEdicion =
    puntoFormState?.modo === "editar" && puntoFormState.punto ? puntoFormState.punto : null;
  const puedeRegistrarActividad =
    !!puntoEnEdicion && (puntoEnEdicion.tipo === "comedero" || puntoEnEdicion.tipo === "bebedero");

  return (
    <div className="relative flex-1">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3">
        <SyncBadge />
      </div>

      <div className="absolute bottom-24 right-3 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={toggleBoundaryEdit}
          className={`rounded-full px-4 py-3 text-xs font-medium shadow ${
            editingBoundary
              ? "bg-amber-600 text-white"
              : "border border-black/10 bg-white/95 text-foreground dark:border-white/15 dark:bg-black/90"
          }`}
        >
          {editingBoundary ? "Guardar linde" : "Editar linde"}
        </button>
        <button
          type="button"
          onClick={() => toggleModoColocar("captura")}
          className={`rounded-full px-4 py-3 text-xs font-medium shadow ${
            modoColocar === "captura"
              ? "bg-emerald-800 text-white"
              : "border border-black/10 bg-white/95 text-foreground dark:border-white/15 dark:bg-black/90"
          }`}
        >
          {modoColocar === "captura" ? "Toca el mapa…" : "🐗 + Captura"}
        </button>
        <button
          type="button"
          onClick={() => toggleModoColocar("punto")}
          className={`rounded-full px-4 py-3 text-xs font-medium shadow ${
            modoColocar === "punto"
              ? "bg-emerald-800 text-white"
              : "border border-black/10 bg-white/95 text-foreground dark:border-white/15 dark:bg-black/90"
          }`}
        >
          {modoColocar === "punto" ? "Toca el mapa…" : "+ Punto"}
        </button>
      </div>

      {puntoFormState && (
        <PuntoForm
          titulo={puntoFormState.modo === "crear" ? "Nuevo punto" : "Editar punto"}
          inicial={{
            nombre: puntoFormState.punto?.nombre ?? "",
            tipo: puntoFormState.punto?.tipo ?? "otro",
            notas: puntoFormState.punto?.notas ?? null,
          }}
          puedeEditar={puedeEditarPunto}
          puedeBorrar={!!puntoFormState.punto && (puntoFormState.punto.creado_por === userId || isAdmin)}
          onSubmit={handlePuntoSubmit}
          onDelete={puntoFormState.modo === "editar" ? handlePuntoDelete : undefined}
          onCancel={() => setPuntoFormState(null)}
          onRegistrarActividad={
            puedeRegistrarActividad
              ? () => {
                  setActividadPuntoId(puntoEnEdicion!.id);
                  setPuntoFormState(null);
                }
              : undefined
          }
        />
      )}

      {capturaCrearEn && (
        <CapturaForm onSubmit={handleCapturaSubmit} onCancel={() => setCapturaCrearEn(null)} />
      )}

      {capturaDetalle && (
        <CapturaDetail
          captura={capturaDetalle}
          registradoPorNombre={nombres[capturaDetalle.registrado_por] ?? "—"}
          puedeBorrar={capturaDetalle.registrado_por === userId || isAdmin}
          onDelete={handleCapturaDelete}
          onClose={() => setCapturaDetalle(null)}
        />
      )}

      {actividadPuntoId && (
        <ActividadForm
          puntos={puntosLista}
          puntoPreseleccionado={actividadPuntoId}
          onSubmit={handleActividadSubmit}
          onCancel={() => setActividadPuntoId(null)}
        />
      )}
    </div>
  );
}
