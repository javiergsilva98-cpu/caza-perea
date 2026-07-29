"use client";

import { useState } from "react";
import type { PuntoInteresRow } from "@/lib/offline/db";
import type { TipoActividad } from "@/lib/supabase/database.types";
import { TIPO_EMOJI, TIPO_ACTIVIDAD_LABEL } from "@/components/map/icons";
import { hoyISO } from "@/lib/format";
import { BottomSheet } from "@/components/BottomSheet";

const TIPOS = Object.entries(TIPO_ACTIVIDAD_LABEL) as [TipoActividad, string][];

export interface ActividadFormValues {
  punto_interes_id: string;
  tipo: TipoActividad;
  fecha: string;
  proxima_fecha_estimada: string | null;
  notas: string | null;
}

export function ActividadForm({
  puntos,
  puntoPreseleccionado,
  fechaPreseleccionada,
  onSubmit,
  onCancel,
}: {
  puntos: PuntoInteresRow[];
  puntoPreseleccionado?: string;
  fechaPreseleccionada?: string;
  onSubmit: (values: ActividadFormValues) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [puntoInteresId, setPuntoInteresId] = useState(
    puntoPreseleccionado ?? puntos[0]?.id ?? ""
  );
  const [tipo, setTipo] = useState<TipoActividad>("rellenado");
  const [fecha, setFecha] = useState(fechaPreseleccionada ?? hoyISO());
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
      <BottomSheet showHandle={false}>
        <p className="text-sm text-ink-soft">
          Todavía no hay ningún punto de interés creado en el mapa. Crea un
          comedero o bebedero primero para poder registrar actividad sobre él.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink"
        >
          Cerrar
        </button>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet>
      <h2 className="text-base font-semibold text-ink">Nueva actividad</h2>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-ink">Punto de interés</span>
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-1">
              {puntos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPuntoInteresId(p.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${
                    puntoInteresId === p.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent text-ink"
                  }`}
                >
                  <span className="text-lg leading-none">{TIPO_EMOJI[p.tipo]}</span>
                  {p.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-ink">Tipo</span>
            <div className="grid grid-cols-4 gap-2">
              {TIPOS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTipo(value)}
                  className={`rounded-lg border px-2 py-2 text-xs ${
                    tipo === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-ink-soft"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="fecha" className="text-sm font-medium text-ink">
                Fecha
              </label>
              <input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="proxima" className="text-sm font-medium text-ink">
                Próxima (opcional)
              </label>
              <input
                id="proxima"
                type="date"
                value={proximaFecha}
                onChange={(e) => setProximaFecha(e.target.value)}
                className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="actividad-notas" className="text-sm font-medium text-ink">
              Notas
            </label>
            <textarea
              id="actividad-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="resize-none rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
    </BottomSheet>
  );
}
