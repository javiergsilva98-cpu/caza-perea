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

export function PuntoForm({
  titulo,
  inicial,
  puedeEditar,
  puedeBorrar,
  onSubmit,
  onDelete,
  onCancel,
}: {
  titulo: string;
  inicial: PuntoFormValues;
  puedeEditar: boolean;
  puedeBorrar: boolean;
  onSubmit: (values: PuntoFormValues) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onCancel: () => void;
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
      <div className="rounded-t-2xl bg-background p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15 dark:bg-white/20" />
        <h2 className="text-base font-semibold text-foreground">{titulo}</h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="punto-nombre" className="text-sm font-medium text-foreground">
              Nombre
            </label>
            <input
              id="punto-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={!puedeEditar}
              required
              className="rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-foreground outline-none focus:border-emerald-700 disabled:opacity-60 dark:border-white/15 dark:bg-white/5"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">Tipo</span>
            <div className="grid grid-cols-4 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={!puedeEditar}
                  onClick={() => setTipo(t)}
                  className={`rounded-lg border px-2 py-2 text-xs disabled:opacity-60 ${
                    tipo === t
                      ? "border-emerald-700 bg-emerald-800/10 text-emerald-800 dark:text-emerald-400"
                      : "border-black/10 text-foreground/70 dark:border-white/15"
                  }`}
                >
                  {TIPO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="punto-notas" className="text-sm font-medium text-foreground">
              Notas
            </label>
            <textarea
              id="punto-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              disabled={!puedeEditar}
              rows={3}
              className="resize-none rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-foreground outline-none focus:border-emerald-700 disabled:opacity-60 dark:border-white/15 dark:bg-white/5"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-black/10 px-4 py-3 text-sm font-medium text-foreground dark:border-white/15"
            >
              Cerrar
            </button>
            {puedeBorrar && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex-1 rounded-lg border border-red-600/30 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400"
              >
                Borrar
              </button>
            )}
            {puedeEditar && (
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-emerald-800 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
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
