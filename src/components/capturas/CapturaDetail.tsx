"use client";

import type { CapturaRow } from "@/lib/offline/db";
import { formatFecha as formatFechaBase } from "@/lib/format";
import { BottomSheet } from "@/components/BottomSheet";

function formatFecha(iso: string) {
  return formatFechaBase(iso, { year: true });
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
    <BottomSheet>
      <h2 className="text-base font-semibold text-ink">
        {captura.tipo === "captura" ? "🐗" : "👁"} {captura.especie}
        {captura.cantidad > 1 ? ` ×${captura.cantidad}` : ""}
      </h2>
      <p className="mt-1 text-xs text-ink-soft">
        {formatFecha(captura.fecha)} · {registradoPorNombre}
      </p>
      {captura.foto_url && (
        // eslint-disable-next-line @next/next/no-img-element -- URL de Supabase Storage, no una imagen del propio sitio
        <img src={captura.foto_url} alt="" className="mt-3 h-48 w-full rounded-lg object-cover" />
      )}
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
    </BottomSheet>
  );
}
