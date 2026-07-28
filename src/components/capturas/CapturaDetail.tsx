"use client";

import type { CapturaRow } from "@/lib/offline/db";

function formatFecha(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CapturaDetail({
  captura,
  registradoPorNombre,
  puedeBorrar,
  onDelete,
  onClose,
}: {
  captura: CapturaRow;
  registradoPorNombre: string;
  puedeBorrar: boolean;
  onDelete: () => void | Promise<void>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40">
      <div className="rounded-t-2xl bg-bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-soft/30" />
        <h2 className="text-base font-semibold text-ink">
          {captura.tipo === "captura" ? "🐗" : "👁"} {captura.especie}
          {captura.cantidad > 1 ? ` ×${captura.cantidad}` : ""}
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          {formatFecha(captura.fecha)} · {registradoPorNombre}
        </p>
        {captura.notas && <p className="mt-3 text-sm text-ink-soft">{captura.notas}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink"
          >
            Cerrar
          </button>
          {puedeBorrar && (
            <button
              type="button"
              onClick={() => void onDelete()}
              className="flex-1 rounded-lg border border-alert/30 px-4 py-3 text-sm font-medium text-alert"
            >
              Borrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
