"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function NombreField({
  userId,
  nombreInicial,
}: {
  userId: string;
  nombreInicial: string;
}) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(nombreInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function empezarEdicion() {
    setValor(nombre);
    setError(null);
    setEditando(true);
  }

  async function guardar() {
    const limpio = valor.trim();
    if (!limpio || limpio === nombre) {
      setEditando(false);
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase
        .from("usuarios")
        .update({ nombre: limpio })
        .eq("id", userId);
      if (err) throw err;
      setNombre(limpio);
      setEditando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido guardar");
    } finally {
      setGuardando(false);
    }
  }

  if (!editando) {
    return (
      <div className="flex justify-between gap-4">
        <dt className="text-ink-soft">Nombre</dt>
        <dd className="flex items-center gap-2 text-ink">
          {nombre}
          <button type="button" onClick={empezarEdicion} className="text-xs font-medium text-primary">
            Editar
          </button>
        </dd>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <dt className="text-ink-soft">Nombre</dt>
      <dd>
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          autoFocus
          className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={guardando}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </dd>
      {error && <dd className="text-xs text-alert">{error}</dd>}
    </div>
  );
}
