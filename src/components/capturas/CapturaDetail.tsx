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
      <div className="rounded-t-2xl bg-background p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15 dark:bg-white/20" />
        <h2 className="text-base font-semibold text-foreground">
          {captura.tipo === "captura" ? "🐗" : "👁"} {captura.especie}
          {captura.cantidad > 1 ? ` ×${captura.cantidad}` : ""}
        </h2>
        <p className="mt-1 text-xs text-foreground/50">
          {formatFecha(captura.fecha)} · {registradoPorNombre}
        </p>
        {captura.notas && <p className="mt-3 text-sm text-foreground/70">{captura.notas}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-black/10 px-4 py-3 text-sm font-medium text-foreground dark:border-white/15"
          >
            Cerrar
          </button>
          {puedeBorrar && (
            <button
              type="button"
              onClick={() => void onDelete()}
              className="flex-1 rounded-lg border border-red-600/30 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400"
            >
              Borrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
