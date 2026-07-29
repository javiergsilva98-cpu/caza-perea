"use client";

import { useState } from "react";
import type { TipoCaptura } from "@/lib/supabase/database.types";
import { FotoPicker } from "@/components/FotoPicker";
import { subirFoto } from "@/lib/data/fotos";
import { hoyISO } from "@/lib/format";
import { BottomSheet } from "@/components/BottomSheet";

const ESPECIES = [
  "Conejo",
  "Perdiz",
  "Paloma",
  "Zorro",
  "Jabalí",
  "Corzo",
  "Codorniz",
  "Liebre",
  "Zorzal",
];

export interface CapturaFormValues {
  tipo: TipoCaptura;
  especie: string;
  cantidad: number;
  fecha: string;
  notas: string | null;
  foto_url: string | null;
}

// Cada "Añadir" guarda esa entrada y deja el formulario abierto, para poder
// registrar varias piezas de una tirada (p.ej. una paloma y un conejo)
// sin tener que reabrirlo cada vez.
export function CapturaForm({
  onSubmit,
  onCerrar,
}: {
  onSubmit: (values: CapturaFormValues) => void | Promise<void>;
  onCerrar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoCaptura>("captura");
  const [especie, setEspecie] = useState(ESPECIES[0]);
  const [cantidad, setCantidad] = useState(1);
  const [fecha, setFecha] = useState(hoyISO());
  const [notas, setNotas] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anadidas, setAnadidas] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      await onSubmit({ tipo, especie, cantidad, fecha, notas: notas.trim() || null, foto_url });
      setAnadidas((prev) => [
        ...prev,
        `${tipo === "captura" ? "🐗" : "👁"} ${especie}${cantidad > 1 ? ` ×${cantidad}` : ""}`,
      ]);
      setCantidad(1);
      setNotas("");
      setFotoFile(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet>
      <h2 className="text-base font-semibold text-ink">Nueva captura/avistamiento</h2>

      {anadidas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {anadidas.map((a, i) => (
            <span
              key={i}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              ✓ {a}
            </span>
          ))}
        </div>
      )}

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
          <select
            id="especie"
            value={especie}
            onChange={(e) => setEspecie(e.target.value)}
            className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
          >
            {ESPECIES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
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
            onClick={onCerrar}
            className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink"
          >
            {anadidas.length > 0 ? "Terminar" : "Cancelar"}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {subiendoFoto ? "Subiendo foto…" : saving ? "Guardando…" : "Añadir"}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
