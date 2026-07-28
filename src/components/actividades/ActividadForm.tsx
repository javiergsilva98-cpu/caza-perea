"use client";

import { useState } from "react";
import type { PuntoInteresRow } from "@/lib/offline/db";
import type { TipoActividad } from "@/lib/supabase/database.types";

const TIPOS: { value: TipoActividad; label: string }[] = [
  { value: "rellenado", label: "Rellenado" },
  { value: "revision", label: "Revisión" },
  { value: "reparacion", label: "Reparación" },
  { value: "otro", label: "Otro" },
];

export interface ActividadFormValues {
  punto_interes_id: string;
  tipo: TipoActividad;
  fecha: string;
  proxima_fecha_estimada: string | null;
  notas: string | null;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ActividadForm({
  puntos,
  puntoPreseleccionado,
  onSubmit,
  onCancel,
}: {
  puntos: PuntoInteresRow[];
  puntoPreseleccionado?: string;
  onSubmit: (values: ActividadFormValues) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [puntoInteresId, setPuntoInteresId] = useState(
    puntoPreseleccionado ?? puntos[0]?.id ?? ""
  );
  const [tipo, setTipo] = useState<TipoActividad>("rellenado");
  const [fecha, setFecha] = useState(hoyISO());
  const [proximaFecha, setProximaFecha] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!puntoInteresId) return;
    setSaving(true);
    try {
      await onSubmit({
        punto_interes_id: puntoInteresId,
        tipo,
        fecha,
        proxima_fecha_estimada: proximaFecha || null,
        notas: notas.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  if (puntos.length === 0) {
    return (
      <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40">
        <div className="rounded-t-2xl bg-background p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <p className="text-sm text-foreground/70">
            Todavía no hay ningún punto de interés creado en el mapa. Crea un
            comedero o bebedero primero para poder registrar actividad sobre él.
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 w-full rounded-lg border border-black/10 px-4 py-3 text-sm font-medium text-foreground dark:border-white/15"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40">
      <div className="rounded-t-2xl bg-background p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15 dark:bg-white/20" />
        <h2 className="text-base font-semibold text-foreground">Nueva actividad</h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="punto" className="text-sm font-medium text-foreground">
              Punto de interés
            </label>
            <select
              id="punto"
              value={puntoInteresId}
              onChange={(e) => setPuntoInteresId(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-foreground outline-none focus:border-emerald-700 dark:border-white/15 dark:bg-white/5"
            >
              {puntos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">Tipo</span>
            <div className="grid grid-cols-4 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={`rounded-lg border px-2 py-2 text-xs ${
                    tipo === t.value
                      ? "border-emerald-700 bg-emerald-800/10 text-emerald-800 dark:text-emerald-400"
                      : "border-black/10 text-foreground/70 dark:border-white/15"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="fecha" className="text-sm font-medium text-foreground">
                Fecha
              </label>
              <input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-foreground outline-none focus:border-emerald-700 dark:border-white/15 dark:bg-white/5"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="proxima" className="text-sm font-medium text-foreground">
                Próxima (opcional)
              </label>
              <input
                id="proxima"
                type="date"
                value={proximaFecha}
                onChange={(e) => setProximaFecha(e.target.value)}
                className="rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-foreground outline-none focus:border-emerald-700 dark:border-white/15 dark:bg-white/5"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="actividad-notas" className="text-sm font-medium text-foreground">
              Notas
            </label>
            <textarea
              id="actividad-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="resize-none rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-foreground outline-none focus:border-emerald-700 dark:border-white/15 dark:bg-white/5"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-black/10 px-4 py-3 text-sm font-medium text-foreground dark:border-white/15"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-emerald-800 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
