"use client";

import { useState } from "react";
import { pareceUrl, parseDMS, parseDecimal, type Coords } from "@/lib/geo/google-maps";
import { BottomSheet } from "@/components/BottomSheet";

async function resolverUbicacion(texto: string): Promise<Coords> {
  const limpio = texto.trim();
  if (!limpio) throw new Error("Pega un enlace o unas coordenadas");

  if (pareceUrl(limpio)) {
    const res = await fetch("/api/resolver-mapa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: limpio }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "No se ha podido resolver el enlace");
    return data as Coords;
  }

  const dms = parseDMS(limpio);
  if (dms) return dms;

  const decimal = parseDecimal(limpio);
  if (decimal) return decimal;

  throw new Error("No he reconocido ahí ni un enlace ni unas coordenadas");
}

export function PegarUbicacionForm({
  onResolved,
  onCancel,
}: {
  onResolved: (coords: Coords) => void;
  onCancel: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBuscando(true);
    try {
      const coords = await resolverUbicacion(texto);
      onResolved(coords);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo ha fallado");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <BottomSheet>
      <h2 className="text-base font-semibold text-ink">Pegar ubicación</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Un enlace de Google Maps (largo o corto tipo maps.app.goo.gl) o unas
        coordenadas, en cualquier formato.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            autoFocus
            placeholder="https://maps.app.goo.gl/... o 39°38'16.1&quot;N 2°51'22.8&quot;W"
            className="resize-none rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
          />

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
              disabled={buscando}
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {buscando ? "Buscando…" : "Buscar"}
            </button>
          </div>
        </form>
    </BottomSheet>
  );
}
