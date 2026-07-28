"use client";

import { useEffect, useState } from "react";
import {
  listDocumentos,
  subirDocumento,
  borrarDocumento,
  urlDocumento,
  type DocumentoUsuario,
} from "@/lib/data/documentos";
import type { TipoDocumento } from "@/lib/supabase/database.types";

const TIPOS: { tipo: TipoDocumento; label: string }[] = [
  { tipo: "seguro", label: "Seguro de caza" },
  { tipo: "licencia", label: "Licencia de caza" },
];

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DocumentosPanel() {
  const [documentos, setDocumentos] = useState<DocumentoUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState<TipoDocumento | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDocumentos().then((docs) => {
      setDocumentos(docs);
      setLoading(false);
    });
  }, []);

  async function handleFile(tipo: TipoDocumento, file: File | null) {
    if (!file) return;
    setError(null);
    setSubiendo(tipo);
    try {
      const doc = await subirDocumento(tipo, file);
      setDocumentos((prev) => [...prev.filter((d) => d.tipo !== tipo), doc]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido subir el archivo");
    } finally {
      setSubiendo(null);
    }
  }

  async function handleVer(doc: DocumentoUsuario) {
    const url = await urlDocumento(doc.storage_path);
    if (url) window.open(url, "_blank");
    else setError("No se ha podido abrir el documento");
  }

  async function handleBorrar(doc: DocumentoUsuario) {
    await borrarDocumento(doc);
    setDocumentos((prev) => prev.filter((d) => d.id !== doc.id));
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-card p-4">
      <div>
        <p className="text-sm font-medium text-ink">Mi documentación</p>
        <p className="text-xs text-ink-soft">Privado — solo tú puedes verla.</p>
      </div>

      {loading && <p className="text-sm text-ink-soft">Cargando…</p>}

      {!loading &&
        TIPOS.map(({ tipo, label }) => {
          const doc = documentos.find((d) => d.tipo === tipo);
          return (
            <div key={tipo} className="rounded-lg border border-border p-3">
              <p className="text-sm text-ink">{label}</p>
              <p className="mt-0.5 truncate text-xs text-ink-soft">
                {doc ? `${doc.nombre_archivo} · ${formatFecha(doc.fecha_subida)}` : "Sin subir"}
              </p>
              <div className="mt-2 flex gap-2">
                {doc && (
                  <button
                    type="button"
                    onClick={() => void handleVer(doc)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-ink"
                  >
                    Ver
                  </button>
                )}
                {doc && (
                  <button
                    type="button"
                    onClick={() => void handleBorrar(doc)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-alert"
                  >
                    Borrar
                  </button>
                )}
                <label className="ml-auto rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white">
                  {subiendo === tipo ? "Subiendo…" : doc ? "Reemplazar" : "Subir"}
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    disabled={subiendo === tipo}
                    onChange={(e) => void handleFile(tipo, e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          );
        })}

      {error && <p className="text-sm text-alert">{error}</p>}
    </div>
  );
}
