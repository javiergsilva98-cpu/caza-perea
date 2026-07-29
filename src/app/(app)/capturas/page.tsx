"use client";

import { useEffect, useState } from "react";
import { listCapturas, crearCaptura, borrarCaptura } from "@/lib/data/capturas";
import { listUsuariosNombres } from "@/lib/data/usuarios";
import { startSyncTriggers } from "@/lib/sync/sync-manager";
import { createClient } from "@/lib/supabase/client";
import type { CapturaRow } from "@/lib/offline/db";
import { CapturaForm, type CapturaFormValues } from "@/components/capturas/CapturaForm";
import { PegarUbicacionForm } from "@/components/map/PegarUbicacionForm";
import { SyncBadge } from "@/components/map/SyncBadge";
import type { Coords } from "@/lib/geo/google-maps";
import { formatFecha } from "@/lib/format";

export default function CapturasPage() {
  const [capturas, setCapturas] = useState<CapturaRow[]>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pegarUbicacionAbierto, setPegarUbicacionAbierto] = useState(false);
  const [ubicacionPendiente, setUbicacionPendiente] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startSyncTriggers();
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserId(session?.user.id ?? null);

      const [lista, mapaNombres] = await Promise.all([
        listCapturas(),
        listUsuariosNombres(),
      ]);
      setCapturas(lista);
      setNombres(mapaNombres);
      setLoading(false);
    })();
  }, []);

  async function handleSubmit(values: CapturaFormValues) {
    const row = await crearCaptura({
      ...values,
      lat: ubicacionPendiente?.lat ?? null,
      lng: ubicacionPendiente?.lng ?? null,
    });
    setCapturas((prev) => [row, ...prev]);
    setShowForm(false);
    setUbicacionPendiente(null);
  }

  async function handleDelete(id: string) {
    await borrarCaptura(id);
    setCapturas((prev) => prev.filter((c) => c.id !== id));
  }

  function handleUbicacionResuelta(coords: Coords) {
    setUbicacionPendiente(coords);
    setPegarUbicacionAbierto(false);
    setShowForm(true);
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="pointer-events-none sticky top-0 z-20 flex justify-center px-3 pt-3">
        <SyncBadge />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <h1 className="text-xl font-semibold text-ink">Capturas y avistamientos</h1>

        {loading && <p className="mt-4 text-sm text-ink-soft">Cargando…</p>}

        {!loading && capturas.length === 0 && (
          <p className="mt-4 text-sm text-ink-soft">
            Nada registrado todavía. Toca el botón + de abajo para añadir la primera.
          </p>
        )}

        <ul className="mt-4 flex flex-col gap-2">
          {capturas.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-border bg-bg-card p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-sm font-medium text-ink">
                    {c.tipo === "captura" ? "🐗" : "👁"} {c.especie}
                    {c.cantidad > 1 ? ` ×${c.cantidad}` : ""}
                    {c.lat !== null && c.lng !== null && " 📍"}
                  </span>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {formatFecha(c.fecha)} · {nombres[c.registrado_por] ?? "—"}
                  </p>
                  {c.notas && <p className="mt-1 text-sm text-ink-soft">{c.notas}</p>}
                </div>
                {c.registrado_por === userId && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(c.id)}
                    className="shrink-0 text-xs text-alert"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-20 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setPegarUbicacionAbierto(true)}
          aria-label="Añadir desde un enlace"
          title="Añadir desde un enlace"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg-card text-xl text-ink shadow"
        >
          📍
        </button>
        <button
          type="button"
          onClick={() => {
            setUbicacionPendiente(null);
            setShowForm(true);
          }}
          aria-label="Registrar captura"
          title="Registrar captura"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl leading-none text-white shadow-lg"
        >
          +
        </button>
      </div>

      {showForm && (
        <CapturaForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setUbicacionPendiente(null);
          }}
        />
      )}

      {pegarUbicacionAbierto && (
        <PegarUbicacionForm
          onResolved={handleUbicacionResuelta}
          onCancel={() => setPegarUbicacionAbierto(false)}
        />
      )}
    </div>
  );
}
