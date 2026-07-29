"use client";

import type { ProgresoDescarga } from "@/lib/offline/tile-cache";

const KB_POR_TESELA = 20;

function formatMB(tiles: number) {
  return ((tiles * KB_POR_TESELA) / 1024).toFixed(1);
}

export function DescargaMapaModal({
  estado,
  totalTiles,
  progreso,
  onConfirmar,
  onCancelar,
  onCerrar,
}: {
  estado: "confirmar" | "descargando" | "completa" | "demasiado_grande";
  totalTiles: number;
  progreso: ProgresoDescarga | null;
  onConfirmar: () => void;
  onCancelar: () => void;
  onCerrar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40">
      <div className="rounded-t-2xl bg-bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-soft/30" />
        <h2 className="text-base font-semibold text-ink">Descargar zona sin conexión</h2>

        {estado === "confirmar" && (
          <>
            <p className="mt-3 text-sm text-ink-soft">
              Se descargarán aproximadamente <strong className="text-ink">{totalTiles}</strong>{" "}
              teselas (~{formatMB(totalTiles)} MB) de la zona que ves ahora en el mapa, en varios
              niveles de zoom. Puede tardar unos minutos según tu conexión — no cierres la app
              mientras descarga.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onCancelar}
                className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirmar}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white"
              >
                Descargar
              </button>
            </div>
          </>
        )}

        {estado === "demasiado_grande" && (
          <>
            <p className="mt-3 text-sm text-ink-soft">
              La zona que ves ahora es demasiado grande para descargar de golpe (
              {totalTiles} teselas). Acércate un poco más (haz zoom) sobre la parte que te
              interese y vuelve a intentarlo.
            </p>
            <button
              type="button"
              onClick={onCerrar}
              className="mt-4 w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink"
            >
              Cerrar
            </button>
          </>
        )}

        {estado === "descargando" && progreso && (
          <>
            <p className="mt-3 text-sm text-ink-soft">
              Descargando teselas… {progreso.hechas}/{progreso.total}
              {progreso.fallidas > 0 && ` (${progreso.fallidas} con error)`}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(progreso.hechas / progreso.total) * 100}%` }}
              />
            </div>
            <button
              type="button"
              onClick={onCancelar}
              className="mt-4 w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink"
            >
              Cancelar
            </button>
          </>
        )}

        {estado === "completa" && progreso && (
          <>
            <p className="mt-3 text-sm text-ink-soft">
              Descarga completa: <strong className="text-ink">{progreso.hechas}</strong> teselas
              guardadas para uso sin conexión
              {progreso.fallidas > 0 && ` (${progreso.fallidas} no se pudieron descargar)`}.
            </p>
            <button
              type="button"
              onClick={onCerrar}
              className="mt-4 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white"
            >
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
