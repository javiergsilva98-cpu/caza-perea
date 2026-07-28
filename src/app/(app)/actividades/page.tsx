"use client";

import { useEffect, useMemo, useState } from "react";
import { listActividades, crearActividad } from "@/lib/data/actividades";
import { listPuntosInteres } from "@/lib/data/puntos-interes";
import { listUsuariosNombres } from "@/lib/data/usuarios";
import { startSyncTriggers } from "@/lib/sync/sync-manager";
import type { ActividadRow, PuntoInteresRow } from "@/lib/offline/db";
import {
  ActividadForm,
  type ActividadFormValues,
} from "@/components/actividades/ActividadForm";
import { SyncBadge } from "@/components/map/SyncBadge";

const TIPO_LABEL: Record<string, string> = {
  rellenado: "Rellenado",
  revision: "Revisión",
  reparacion: "Reparación",
  otro: "Otro",
};

function diasDesde(fechaISO: string): number {
  const ms = Date.now() - new Date(fechaISO + "T00:00:00").getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function formatFecha(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

export default function ActividadesPage() {
  const [actividades, setActividades] = useState<ActividadRow[]>([]);
  const [puntos, setPuntos] = useState<PuntoInteresRow[]>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startSyncTriggers();
    (async () => {
      const [listaActividades, listaPuntos, mapaNombres] = await Promise.all([
        listActividades(),
        listPuntosInteres(),
        listUsuariosNombres(),
      ]);
      setActividades(listaActividades);
      setPuntos(listaPuntos);
      setNombres(mapaNombres);
      setLoading(false);
    })();
  }, []);

  const resumen = useMemo(() => {
    const puntosMantenimiento = puntos.filter(
      (p) => p.tipo === "comedero" || p.tipo === "bebedero"
    );
    return puntosMantenimiento
      .map((p) => {
        const ultima = actividades
          .filter((a) => a.punto_interes_id === p.id)
          .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
        return { punto: p, ultima };
      })
      .sort((a, b) => {
        if (!a.ultima && !b.ultima) return 0;
        if (!a.ultima) return -1;
        if (!b.ultima) return 1;
        return a.ultima.fecha < b.ultima.fecha ? -1 : 1;
      });
  }, [puntos, actividades]);

  async function handleSubmit(values: ActividadFormValues) {
    const row = await crearActividad(values);
    setActividades((prev) => [row, ...prev]);
    setShowForm(false);
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="pointer-events-none sticky top-0 z-20 flex justify-center px-3 pt-3">
        <SyncBadge />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <h1 className="text-xl font-semibold text-foreground">Actividad y mantenimiento</h1>

        {!loading && resumen.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-foreground/50">
              Comederos y bebederos
            </h2>
            <ul className="mt-2 flex flex-col gap-2">
              {resumen.map(({ punto, ultima }) => (
                <li
                  key={punto.id}
                  className="flex items-center justify-between rounded-xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5"
                >
                  <span className="text-sm text-foreground">
                    {punto.tipo === "comedero" ? "🌾" : "💧"} {punto.nombre}
                  </span>
                  <span
                    className={`text-xs ${
                      !ultima || diasDesde(ultima.fecha) > 14
                        ? "font-medium text-amber-600 dark:text-amber-400"
                        : "text-foreground/50"
                    }`}
                  >
                    {ultima ? `hace ${diasDesde(ultima.fecha)} días` : "sin registro"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2 className="mt-6 text-xs font-medium uppercase tracking-wide text-foreground/50">
          Historial
        </h2>

        {loading && <p className="mt-2 text-sm text-foreground/50">Cargando…</p>}
        {!loading && actividades.length === 0 && (
          <p className="mt-2 text-sm text-foreground/50">
            Nada registrado todavía. Toca &quot;+ Registrar&quot; para añadir la primera.
          </p>
        )}

        <ul className="mt-2 flex flex-col gap-2">
          {actividades.map((a) => {
            const punto = puntos.find((p) => p.id === a.punto_interes_id);
            return (
              <li
                key={a.id}
                className="rounded-xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5"
              >
                <span className="text-sm font-medium text-foreground">
                  {TIPO_LABEL[a.tipo] ?? a.tipo} · {punto?.nombre ?? "Punto eliminado"}
                </span>
                <p className="mt-0.5 text-xs text-foreground/50">
                  {formatFecha(a.fecha)} · {nombres[a.realizado_por] ?? "—"}
                  {a.proxima_fecha_estimada && ` · próxima: ${formatFecha(a.proxima_fecha_estimada)}`}
                </p>
                {a.notas && <p className="mt-1 text-sm text-foreground/70">{a.notas}</p>}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="absolute bottom-4 right-4 z-20">
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-full bg-emerald-800 px-5 py-3 text-sm font-medium text-white shadow"
        >
          + Registrar
        </button>
      </div>

      {showForm && (
        <ActividadForm
          puntos={puntos}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
