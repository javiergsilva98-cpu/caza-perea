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
import { startSyncTriggers } from "@/lib/sync/sync-manager";
import { createClient } from "@/lib/supabase/client";
import type { PuntoInteresRow } from "@/lib/offline/db";
import type { Json } from "@/lib/supabase/database.types";
import { iconoPunto } from "./icons";
import { PuntoForm, type PuntoFormValues } from "./PuntoForm";
import { SyncBadge } from "./SyncBadge";

interface FormState {
  modo: "crear" | "editar";
  lat: number;
  lng: number;
  punto?: PuntoInteresRow;
}

const ESRI_IMAGERY_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_ATTRIBUTION =
  "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, GIS User Community";

export function FincaMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map());
  const puntosRef = useRef<globalThis.Map<string, PuntoInteresRow>>(new globalThis.Map());
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const addModeRef = useRef(false);

  const [addMode, setAddMode] = useState(false);
  const [editingBoundary, setEditingBoundary] = useState(false);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    addModeRef.current = addMode;
  }, [addMode]);

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
      setFormState({ modo: "editar", lat: actual.lat, lng: actual.lng, punto: actual });
    });
    marker.addTo(map);
    markersRef.current.set(p.id, marker);
  }

  function removeMarker(id: string) {
    markersRef.current.get(id)?.remove();
    markersRef.current.delete(id);
    puntosRef.current.delete(id);
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

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (!addModeRef.current) return;
      setFormState({ modo: "crear", lat: e.latlng.lat, lng: e.latlng.lng });
      setAddMode(false);
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

  // Carga inicial de datos (puntos + linde), con caché offline.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [puntos, limite] = await Promise.all([
        listPuntosInteres(),
        getFincaLimiteActual(),
      ]);
      if (cancelled) return;
      puntos.forEach(addOrUpdateMarker);
      if (limite) renderBoundary(limite.geometria);
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

  async function handleFormSubmit(values: PuntoFormValues) {
    if (!formState) return;
    if (formState.modo === "crear") {
      const row = await crearPuntoInteres({
        nombre: values.nombre,
        tipo: values.tipo,
        notas: values.notas,
        lat: formState.lat,
        lng: formState.lng,
      });
      addOrUpdateMarker(row);
    } else if (formState.punto) {
      await editarPuntoInteres(formState.punto.id, values);
      addOrUpdateMarker({ ...formState.punto, ...values });
    }
    setFormState(null);
  }

  async function handleDelete() {
    if (!formState?.punto) return;
    await borrarPuntoInteres(formState.punto.id);
    removeMarker(formState.punto.id);
    setFormState(null);
  }

  const puedeEditarPunto =
    formState?.modo === "crear" ||
    (!!formState?.punto && (formState.punto.creado_por === userId || isAdmin));

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
          onClick={() => setAddMode((v) => !v)}
          className={`rounded-full px-4 py-3 text-xs font-medium shadow ${
            addMode
              ? "bg-emerald-800 text-white"
              : "border border-black/10 bg-white/95 text-foreground dark:border-white/15 dark:bg-black/90"
          }`}
        >
          {addMode ? "Toca el mapa…" : "+ Punto"}
        </button>
      </div>

      {formState && (
        <PuntoForm
          titulo={formState.modo === "crear" ? "Nuevo punto" : "Editar punto"}
          inicial={{
            nombre: formState.punto?.nombre ?? "",
            tipo: formState.punto?.tipo ?? "otro",
            notas: formState.punto?.notas ?? null,
          }}
          puedeEditar={puedeEditarPunto}
          puedeBorrar={!!formState.punto && (formState.punto.creado_por === userId || isAdmin)}
          onSubmit={handleFormSubmit}
          onDelete={formState.modo === "editar" ? handleDelete : undefined}
          onCancel={() => setFormState(null)}
        />
      )}
    </div>
  );
}
