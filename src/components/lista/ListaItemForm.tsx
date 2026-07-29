"use client";

import { useState } from "react";
import type { UsuarioBasico } from "@/lib/data/usuarios";

export interface ListaItemFormValues {
  texto: string;
  responsable: string;
}

export function ListaItemForm({
  usuarios,
  usuarioActualId,
  onSubmit,
  onCancel,
  error,
}: {
  usuarios: UsuarioBasico[];
  usuarioActualId: string | null;
  onSubmit: (values: ListaItemFormValues) => void | Promise<void>;
  onCancel: () => void;
  error?: string | null;
}) {
  const [texto, setTexto] = useState("");
  const [responsable, setResponsable] = useState(usuarioActualId ?? usuarios[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() || !responsable) return;
    setSaving(true);
    try {
      await onSubmit({ texto: texto.trim(), responsable });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40">
      <div className="rounded-t-2xl bg-bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-soft/30" />
        <h2 className="text-base font-semibold text-ink">Nuevo ítem</h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="item-texto" className="text-sm font-medium text-ink">
              Qué hay que llevar
            </label>
            <input
              id="item-texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              required
              autoFocus
              placeholder="Botas, chaleco, munición…"
              className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="item-responsable" className="text-sm font-medium text-ink">
              Responsable
            </label>
            <select
              id="item-responsable"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
            >
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-alert">{error}</p>}

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
      </div>
    </div>
  );
}
