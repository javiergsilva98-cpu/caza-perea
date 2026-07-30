"use client";

import { useState } from "react";
import type { PuntoInteresRow } from "@/lib/offline/db";
import type { UsuarioBasico } from "@/lib/data/usuarios";
import { hoyISO } from "@/lib/format";
import { BottomSheet } from "@/components/BottomSheet";

export interface EsperaFormValues {
  puesto_id: string;
  cazador_id: string;
  fecha: string;
  notas: string | null;
}

export function EsperaForm({
  puestos,
  usuarios,
  onSubmit,
  onCancel,
  error,
}: {
  puestos: PuntoInteresRow[];
  usuarios: UsuarioBasico[];
  onSubmit: (values: EsperaFormValues) => void | Promise<void>;
  onCancel: () => void;
  error?: string | null;
}) {
  const [puestoId, setPuestoId] = useState(puestos[0]?.id ?? "");
  const [cazadorId, setCazadorId] = useState(usuarios[0]?.id ?? "");
  const [fecha, setFecha] = useState(hoyISO());
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!puestoId || !cazadorId) return;
    setSaving(true);
    try {
      await onSubmit({ puesto_id: puestoId, cazador_id: cazadorId, fecha, notas: notas.trim() || null });
    } finally {
      setSaving(false);
    }
  }

  if (puestos.length === 0) {
    return (
      <BottomSheet showHandle={false} onBackdropClick={onCancel}>
        <p className="text-sm text-ink-soft">
          Todavía no hay ningún puesto creado en el mapa. Crea uno (tipo
          &quot;Puesto&quot;) primero para poder asignarlo.
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
    <BottomSheet onBackdropClick={onCancel}>
      <h2 className="text-base font-semibold text-ink">Asignar puesto</h2>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="puesto" className="text-sm font-medium text-ink">
              Puesto
            </label>
            <select
              id="puesto"
              value={puestoId}
              onChange={(e) => setPuestoId(e.target.value)}
              className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
            >
              {puestos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="cazador" className="text-sm font-medium text-ink">
              Cazador
            </label>
            <select
              id="cazador"
              value={cazadorId}
              onChange={(e) => setCazadorId(e.target.value)}
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
            <label htmlFor="espera-notas" className="text-sm font-medium text-ink">
              Notas
            </label>
            <textarea
              id="espera-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
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
              {saving ? "Guardando…" : "Asignar"}
            </button>
          </div>
        </form>
    </BottomSheet>
  );
}
