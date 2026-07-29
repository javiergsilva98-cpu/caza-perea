"use client";

import { useState } from "react";
import type { TipoCaptura } from "@/lib/supabase/database.types";
import { FotoPicker } from "@/components/FotoPicker";
import { subirFoto } from "@/lib/data/fotos";
import { hoyISO } from "@/lib/format";
import { BottomSheet } from "@/components/BottomSheet";

const ESPECIES_SUGERIDAS = [
  "Jabalí",
  "Conejo",
  "Liebre",
  "Perdiz",
  "Zorro",
  "Paloma",
  "Corzo",
];

export interface CapturaFormValues {
  tipo: TipoCaptura;
  especie: string;
  cantidad: number;
  fecha: string;
  notas: string | null;
  foto_url: string | null;
}


export function CapturaForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: CapturaFormValues) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [tipo, setTipo] = useState<TipoCaptura>("captura");
  const [especie, setEspecie] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [fecha, setFecha] = useState(hoyISO());
  const [notas, setNotas] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!especie.trim()) return;
    setSaving(true);
    setError(null);
    let foto_url: string | null = null;
    if (fotoFile) {
      setSubiendoFoto(true);
      try {
        foto_url = await subirFoto("capturas", fotoFile);
      } catch {
        setError("No se ha podido subir la foto (¿sin conexión?) — se guarda sin ella.");
      } finally {
        setSubiendoFoto(false);
      }
    }
    try {
      await onSubmit({
        tipo,
        especie: especie.trim(),
        cantidad,
        fecha,
        notas: notas.trim() || null,
        foto_url,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet>
      <h2 className="text-base font-semibold text-ink">Nueva captura/avistamiento</h2>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo("captura")}
              className={`rounded-lg border px-3 py-3 text-sm font-medium ${
                tipo === "captura"
                  ? "border-secondary bg-secondary/10 text-secondary"
                  : "border-border text-ink-soft"
              }`}
            >
              🎯 Captura
            </button>
            <button
              type="button"
              onClick={() => setTipo("avistamiento")}
              className={`rounded-lg border px-3 py-3 text-sm font-medium ${
                tipo === "avistamiento"
                  ? "border-secondary bg-secondary/10 text-secondary"
                  : "border-border text-ink-soft"
              }`}
            >
              👁 Avistamiento
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="especie" className="text-sm font-medium text-ink">
              Especie
            </label>
            <input
              id="especie"
              list="especies-sugeridas"
              value={especie}
              onChange={(e) => setEspecie(e.target.value)}
              required
              placeholder="Jabalí, conejo, perdiz…"
              className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
            />
            <datalist id="especies-sugeridas">
              {ESPECIES_SUGERIDAS.map((e) => (
                <option key={e} value={e} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="cantidad" className="text-sm font-medium text-ink">
                Cantidad
              </label>
              <input
                id="cantidad"
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))}
                className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
              />
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
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="captura-notas" className="text-sm font-medium text-ink">
              Notas
            </label>
            <textarea
              id="captura-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="resize-none rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
            />
          </div>

          <FotoPicker onFileChange={setFotoFile} />

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
              className="flex-1 rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {subiendoFoto ? "Subiendo foto…" : saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
    </BottomSheet>
  );
}
