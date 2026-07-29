"use client";

import { useState } from "react";
import type { UsuarioBasico } from "@/lib/data/usuarios";
import { hoyISO } from "@/lib/format";

export interface GastoFormValues {
  concepto: string;
  importe: number;
  pagado_por: string;
  fecha: string;
  notas: string | null;
  proveedor: string | null;
}

export function GastoForm({
  usuarios,
  usuarioActualId,
  onSubmit,
  onCancel,
  error,
}: {
  usuarios: UsuarioBasico[];
  usuarioActualId: string | null;
  onSubmit: (values: GastoFormValues) => void | Promise<void>;
  onCancel: () => void;
  error?: string | null;
}) {
  const [concepto, setConcepto] = useState("");
  const [importe, setImporte] = useState("");
  const [pagadoPor, setPagadoPor] = useState(usuarioActualId ?? usuarios[0]?.id ?? "");
  const [fecha, setFecha] = useState(hoyISO());
  const [proveedor, setProveedor] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valor = parseFloat(importe.replace(",", "."));
    if (!concepto.trim() || !pagadoPor || !valor || valor <= 0) return;
    setSaving(true);
    try {
      await onSubmit({
        concepto: concepto.trim(),
        importe: Math.round(valor * 100) / 100,
        pagado_por: pagadoPor,
        fecha,
        notas: notas.trim() || null,
        proveedor: proveedor.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40">
      <div className="rounded-t-2xl bg-bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-soft/30" />
        <h2 className="text-base font-semibold text-ink">Nuevo gasto</h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="gasto-concepto" className="text-sm font-medium text-ink">
              Concepto
            </label>
            <input
              id="gasto-concepto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              required
              placeholder="Comida, gasolina, reparación…"
              className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="gasto-importe" className="text-sm font-medium text-ink">
                Importe (€)
              </label>
              <input
                id="gasto-importe"
                type="text"
                inputMode="decimal"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                required
                placeholder="0,00"
                className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="gasto-fecha" className="text-sm font-medium text-ink">
                Fecha
              </label>
              <input
                id="gasto-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="gasto-proveedor" className="text-sm font-medium text-ink">
              Proveedor (opcional)
            </label>
            <input
              id="gasto-proveedor"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              placeholder="Piensos Fulanito, Gasolinera…"
              className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="gasto-pagado-por" className="text-sm font-medium text-ink">
              Pagado por
            </label>
            <select
              id="gasto-pagado-por"
              value={pagadoPor}
              onChange={(e) => setPagadoPor(e.target.value)}
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
            <label htmlFor="gasto-notas" className="text-sm font-medium text-ink">
              Notas
            </label>
            <textarea
              id="gasto-notas"
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
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
