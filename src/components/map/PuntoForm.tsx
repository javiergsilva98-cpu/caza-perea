"use client";

import { useState } from "react";
import type { TipoPuntoInteres } from "@/lib/supabase/database.types";
import { TIPO_LABEL } from "./icons";

const TIPOS: TipoPuntoInteres[] = ["comedero", "bebedero", "puesto", "otro"];

export interface PuntoFormValues {
  nombre: string;
  tipo: TipoPuntoInteres;
  notas: string | null;
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PuntoForm({
  titulo,
  inicial,
  puedeEditar,
  puedeBorrar,
  onSubmit,
  onDelete,
  onCancel,
  onRegistrarActividad,
  creadoPorNombre,
  fechaCreacion,
}: {
  titulo: string;
  inicial: PuntoFormValues;
  puedeEditar: boolean;
  puedeBorrar: boolean;
  onSubmit: (values: PuntoFormValues) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onCancel: () => void;
  onRegistrarActividad?: () => void;
  creadoPorNombre?: string;
  fechaCreacion?: string;
}) {
  const [nombre, setNombre] = useState(inicial.nombre);
  const [tipo, setTipo] = useState<TipoPuntoInteres>(inicial.tipo);
  const [notas, setNotas] = useState(inicial.notas ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ nombre: nombre.trim(), tipo, notas: notas.trim() || null });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40">
      <div className="rounded-t-2xl bg-bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-soft/30" />
        <h2 className="text-base font-semibold text-ink">{titulo}</h2>
        {creadoPorNombre && fechaCreacion && (
          <p className="mt-0.5 text-xs text-ink-soft">
            Añadido por {creadoPorNombre} · {formatFecha(fechaCreacion)}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="punto-nombre" className="text-sm font-medium text-ink">
              Nombre
            </label>
            <input
              id="punto-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={!puedeEditar}
              required
              className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-ink">Tipo</span>
            <div className="grid grid-cols-4 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={!puedeEditar}
                  onClick={() => setTipo(t)}
                  className={`rounded-lg border px-2 py-2 text-xs disabled:opacity-60 ${
                    tipo === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-ink-soft"
                  }`}
                >
                  {TIPO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="punto-notas" className="text-sm font-medium text-ink">
              Notas
            </label>
            <textarea
              id="punto-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              disabled={!puedeEditar}
              rows={3}
              className="resize-none rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary disabled:opacity-60"
            />
          </div>

          {onRegistrarActividad && (
            <button
              type="button"
              onClick={onRegistrarActividad}
              className="rounded-lg border border-primary/30 px-4 py-3 text-sm font-medium text-primary"
            >
              🧰 Registrar actividad aquí
            </button>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink"
            >
              Cerrar
            </button>
            {puedeBorrar && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex-1 rounded-lg border border-alert/30 px-4 py-3 text-sm font-medium text-alert"
              >
                Borrar
              </button>
            )}
            {puedeEditar && (
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
