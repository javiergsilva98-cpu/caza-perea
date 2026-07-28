"use client";

import { useEffect, useState } from "react";
import { listCapturas, crearCaptura, borrarCaptura } from "@/lib/data/capturas";
import { listUsuariosNombres } from "@/lib/data/usuarios";
import { startSyncTriggers } from "@/lib/sync/sync-manager";
import { createClient } from "@/lib/supabase/client";
import type { CapturaRow } from "@/lib/offline/db";
import { CapturaForm, type CapturaFormValues } from "@/components/capturas/CapturaForm";
import { SyncBadge } from "@/components/map/SyncBadge";

function formatFecha(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

export default function CapturasPage() {
  const [capturas, setCapturas] = useState<CapturaRow[]>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startSyncTriggers();
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserId(session?.user.id ?? null);

      const [lista, mapaNombres] = await Promise.all([
        listCapturas(),
        listUsuariosNombres(),
      ]);
      setCapturas(lista);
      setNombres(mapaNombres);
      setLoading(false);
    })();
  }, []);

  async function handleSubmit(values: CapturaFormValues) {
    const row = await crearCaptura({ ...values, lat: null, lng: null });
    setCapturas((prev) => [row, ...prev]);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    await borrarCaptura(id);
    setCapturas((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="pointer-events-none sticky top-0 z-20 flex justify-center px-3 pt-3">
        <SyncBadge />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <h1 className="text-xl font-semibold text-foreground">Capturas y avistamientos</h1>

        {loading && <p className="mt-4 text-sm text-foreground/50">Cargando…</p>}

        {!loading && capturas.length === 0 && (
          <p className="mt-4 text-sm text-foreground/50">
            Nada registrado todavía. Toca &quot;+ Registrar&quot; para añadir la primera.
          </p>
        )}

        <ul className="mt-4 flex flex-col gap-2">
          {capturas.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {c.tipo === "captura" ? "🎯" : "👁"} {c.especie}
                    {c.cantidad > 1 ? ` ×${c.cantidad}` : ""}
                  </span>
                  <p className="mt-0.5 text-xs text-foreground/50">
                    {formatFecha(c.fecha)} · {nombres[c.registrado_por] ?? "—"}
                  </p>
                  {c.notas && <p className="mt-1 text-sm text-foreground/70">{c.notas}</p>}
                </div>
                {c.registrado_por === userId && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(c.id)}
                    className="shrink-0 text-xs text-red-600 dark:text-red-400"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute bottom-4 right-4 z-20">
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-full bg-emerald-800 px-5 py-3 text-sm font-medium text-white shadow"
        >
          + Registrar
        </button>
      </div>

      {showForm && (
        <CapturaForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
      )}
    </div>
  );
}
