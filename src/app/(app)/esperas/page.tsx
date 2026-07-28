"use client";

import { useEffect, useMemo, useState } from "react";
import { listEsperas, crearEspera, borrarEspera } from "@/lib/data/esperas";
import { listPuntosInteres } from "@/lib/data/puntos-interes";
import { listUsuarios, type UsuarioBasico } from "@/lib/data/usuarios";
import { startSyncTriggers } from "@/lib/sync/sync-manager";
import { createClient } from "@/lib/supabase/client";
import type { EsperaRow, PuntoInteresRow } from "@/lib/offline/db";
import { EsperaForm, type EsperaFormValues } from "@/components/esperas/EsperaForm";
import { SyncBadge } from "@/components/map/SyncBadge";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatFecha(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default function EsperasPage() {
  const [esperas, setEsperas] = useState<EsperaRow[]>([]);
  const [puestos, setPuestos] = useState<PuntoInteresRow[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioBasico[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startSyncTriggers();
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserId(session?.user.id ?? null);

      const [listaEsperas, listaPuntos, listaUsuarios] = await Promise.all([
        listEsperas(),
        listPuntosInteres(),
        listUsuarios(),
      ]);
      setEsperas(listaEsperas);
      setPuestos(listaPuntos);
      setUsuarios(listaUsuarios);
      setLoading(false);
    })();
  }, []);

  const puestosDisponibles = useMemo(
    () => puestos.filter((p) => p.tipo === "puesto"),
    [puestos]
  );

  const nombrePorId = useMemo(
    () => Object.fromEntries(usuarios.map((u) => [u.id, u.nombre])),
    [usuarios]
  );
  const puestoPorId = useMemo(
    () => Object.fromEntries(puestos.map((p) => [p.id, p.nombre])),
    [puestos]
  );

  const proximas = useMemo(
    () =>
      esperas
        .filter((e) => e.fecha >= hoyISO())
        .sort((a, b) => (a.fecha < b.fecha ? -1 : 1)),
    [esperas]
  );
  const historial = useMemo(
    () => esperas.filter((e) => e.fecha < hoyISO()),
    [esperas]
  );

  const reparto = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const e of esperas) {
      conteo.set(e.cazador_id, (conteo.get(e.cazador_id) ?? 0) + 1);
    }
    return usuarios
      .map((u) => ({ usuario: u, veces: conteo.get(u.id) ?? 0 }))
      .sort((a, b) => a.veces - b.veces);
  }, [esperas, usuarios]);

  async function handleSubmit(values: EsperaFormValues) {
    setFormError(null);
    try {
      const row = await crearEspera(values);
      setEsperas((prev) => [row, ...prev]);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se ha podido guardar");
    }
  }

  async function handleDelete(id: string) {
    await borrarEspera(id);
    setEsperas((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="pointer-events-none sticky top-0 z-20 flex justify-center px-3 pt-3">
        <SyncBadge />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <h1 className="text-xl font-semibold text-ink">Esperas y puestos</h1>

        {!loading && reparto.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {reparto.map(({ usuario, veces }) => (
              <span
                key={usuario.id}
                className="rounded-full border border-border bg-bg-card px-3 py-1 text-xs text-ink-soft"
              >
                {usuario.nombre}: {veces}
              </span>
            ))}
          </div>
        )}

        <h2 className="mt-6 text-xs font-medium uppercase tracking-wide text-ink-soft">
          Próximas
        </h2>
        {loading && <p className="mt-2 text-sm text-ink-soft">Cargando…</p>}
        {!loading && proximas.length === 0 && (
          <p className="mt-2 text-sm text-ink-soft">Nada asignado todavía.</p>
        )}
        <ul className="mt-2 flex flex-col gap-2">
          {proximas.map((e) => (
            <li
              key={e.id}
              className="flex items-start justify-between gap-2 rounded-xl border border-border bg-bg-card p-3"
            >
              <div>
                <span className="text-sm font-medium text-ink">
                  🪑 {puestoPorId[e.puesto_id] ?? "Puesto eliminado"} — {nombrePorId[e.cazador_id] ?? "—"}
                </span>
                <p className="mt-0.5 text-xs text-ink-soft">{formatFecha(e.fecha)}</p>
                {e.notas && <p className="mt-1 text-sm text-ink-soft">{e.notas}</p>}
              </div>
              {(e.asignado_por === userId || e.cazador_id === userId) && (
                <button
                  type="button"
                  onClick={() => void handleDelete(e.id)}
                  className="shrink-0 text-xs text-alert"
                >
                  Quitar
                </button>
              )}
            </li>
          ))}
        </ul>

        {historial.length > 0 && (
          <>
            <h2 className="mt-6 text-xs font-medium uppercase tracking-wide text-ink-soft">
              Historial
            </h2>
            <ul className="mt-2 flex flex-col gap-2">
              {historial.map((e) => (
                <li
                  key={e.id}
                  className="rounded-xl border border-border bg-bg-card/60 p-3 text-sm text-ink-soft"
                >
                  {puestoPorId[e.puesto_id] ?? "Puesto eliminado"} — {nombrePorId[e.cazador_id] ?? "—"} ·{" "}
                  {formatFecha(e.fecha)}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-20">
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setShowForm(true);
          }}
          aria-label="Asignar puesto"
          title="Asignar puesto"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl leading-none text-white shadow-lg"
        >
          +
        </button>
      </div>

      {showForm && (
        <EsperaForm
          puestos={puestosDisponibles}
          usuarios={usuarios}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          error={formError}
        />
      )}
    </div>
  );
}
