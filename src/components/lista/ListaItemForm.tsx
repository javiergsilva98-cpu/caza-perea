"use client";

import { useState } from "react";
import type { UsuarioBasico } from "@/lib/data/usuarios";
import { BottomSheet } from "@/components/BottomSheet";

export interface ListaItemFormValues {
  texto: string;
  responsable: string;
  notas: string | null;
}

export function ListaItemForm({
  titulo,
  inicial,
  usuarios,
  usuarioActualId,
  onSubmit,
  onCancel,
  error,
}: {
  titulo: string;
  inicial?: ListaItemFormValues;
  usuarios: UsuarioBasico[];
  usuarioActualId: string | null;
  onSubmit: (values: ListaItemFormValues) => void | Promise<void>;
  onCancel: () => void;
  error?: string | null;
}) {
  const [texto, setTexto] = useState(inicial?.texto ?? "");
  const [responsable, setResponsable] = useState(
    inicial?.responsable ?? usuarioActualId ?? usuarios[0]?.id ?? ""
  );
  const [notas, setNotas] = useState(inicial?.notas ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() || !responsable) return;
    setSaving(true);
    try {
      await onSubmit({ texto: texto.trim(), responsable, notas: notas.trim() || null });
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet>
      <h2 className="text-base font-semibold text-ink">{titulo}</h2>

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

          <div className="flex flex-col gap-1">
            <label htmlFor="item-notas" className="text-sm font-medium text-ink">
              Notas
            </label>
            <textarea
              id="item-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Por si acaso…"
              className="resize-none rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
            />
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
    </BottomSheet>
  );
}
