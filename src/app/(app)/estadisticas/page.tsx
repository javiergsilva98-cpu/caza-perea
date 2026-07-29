"use client";

import { useEffect, useMemo, useState } from "react";
import { listCapturas } from "@/lib/data/capturas";
import { listAsistencias } from "@/lib/data/calendario";
import { listUsuarios, type UsuarioBasico } from "@/lib/data/usuarios";
import { startSyncTriggers } from "@/lib/sync/sync-manager";
import { createClient } from "@/lib/supabase/client";
import type { CalendarioAsistenciaRow, CapturaRow } from "@/lib/offline/db";
import { SyncBadge } from "@/components/map/SyncBadge";

export default function EstadisticasPage() {
  const [capturas, setCapturas] = useState<CapturaRow[]>([]);
  const [asistencias, setAsistencias] = useState<CalendarioAsistenciaRow[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioBasico[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [scope, setScope] = useState<"yo" | "grupo">("yo");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startSyncTriggers();
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserId(session?.user.id ?? null);

      const [listaCapturas, listaAsistencias, listaUsuarios] = await Promise.all([
        listCapturas(),
        listAsistencias(),
        listUsuarios(),
      ]);
      setCapturas(listaCapturas);
      setAsistencias(listaAsistencias);
      setUsuarios(listaUsuarios);
      setLoading(false);
    })();
  }, []);

  const capturasFiltradas = useMemo(
    () => (scope === "yo" ? capturas.filter((c) => c.registrado_por === userId) : capturas),
    [capturas, scope, userId]
  );
  const asistenciasFiltradas = useMemo(
    () => (scope === "yo" ? asistencias.filter((a) => a.cazador_id === userId) : asistencias),
    [asistencias, scope, userId]
  );

  const totalCapturas = useMemo(
    () => capturasFiltradas.filter((c) => c.tipo === "captura").reduce((acc, c) => acc + c.cantidad, 0),
    [capturasFiltradas]
  );
  const totalAvistamientos = useMemo(
    () =>
      capturasFiltradas.filter((c) => c.tipo === "avistamiento").reduce((acc, c) => acc + c.cantidad, 0),
    [capturasFiltradas]
  );
  const diasDeCaza = useMemo(
    () => new Set(asistenciasFiltradas.map((a) => a.fecha)).size,
    [asistenciasFiltradas]
  );

  const porEspecie = useMemo(() => {
    const acc = new Map<string, number>();
    for (const c of capturasFiltradas.filter((c) => c.tipo === "captura")) {
      acc.set(c.especie, (acc.get(c.especie) ?? 0) + c.cantidad);
    }
    return Array.from(acc.entries())
      .map(([especie, cantidad]) => ({ especie, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [capturasFiltradas]);

  const maxEspecie = porEspecie[0]?.cantidad ?? 1;

  const porPersona = useMemo(() => {
    return usuarios
      .map((u) => ({
        usuario: u,
        capturas: capturas
          .filter((c) => c.registrado_por === u.id && c.tipo === "captura")
          .reduce((acc, c) => acc + c.cantidad, 0),
        dias: new Set(asistencias.filter((a) => a.cazador_id === u.id).map((a) => a.fecha)).size,
      }))
      .sort((a, b) => b.capturas - a.capturas);
  }, [usuarios, capturas, asistencias]);

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="pointer-events-none sticky top-0 z-20 flex justify-center px-3 pt-3">
        <SyncBadge />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <h1 className="text-xl font-semibold text-ink">Estadísticas</h1>

        <div className="mt-4 flex rounded-full border border-border p-1">
          <button
            type="button"
            onClick={() => setScope("yo")}
            className={`flex-1 rounded-full py-2 text-sm font-medium ${
              scope === "yo" ? "bg-primary text-white" : "text-ink-soft"
            }`}
          >
            Yo
          </button>
          <button
            type="button"
            onClick={() => setScope("grupo")}
            className={`flex-1 rounded-full py-2 text-sm font-medium ${
              scope === "grupo" ? "bg-primary text-white" : "text-ink-soft"
            }`}
          >
            Todo el coto
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-ink-soft">Cargando…</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-bg-card p-3">
                <p className="text-xs text-ink-soft">🐗 Capturas</p>
                <p className="text-2xl font-semibold text-ink">{totalCapturas}</p>
              </div>
              <div className="rounded-xl border border-border bg-bg-card p-3">
                <p className="text-xs text-ink-soft">👁 Avistamientos</p>
                <p className="text-2xl font-semibold text-ink">{totalAvistamientos}</p>
              </div>
              <div className="rounded-xl border border-border bg-bg-card p-3">
                <p className="text-xs text-ink-soft">📅 Días de caza</p>
                <p className="text-2xl font-semibold text-ink">{diasDeCaza}</p>
              </div>
              <div className="rounded-xl border border-border bg-bg-card p-3">
                <p className="text-xs text-ink-soft">Capturas / día</p>
                <p className="text-2xl font-semibold text-ink">
                  {diasDeCaza > 0 ? (totalCapturas / diasDeCaza).toFixed(1) : "—"}
                </p>
              </div>
            </div>

            <h2 className="mt-6 text-xs font-medium uppercase tracking-wide text-ink-soft">
              Especies más cazadas
            </h2>
            {porEspecie.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Nada registrado todavía.</p>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {porEspecie.map(({ especie, cantidad }) => (
                  <div key={especie}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink">{especie}</span>
                      <span className="text-ink-soft">{cantidad}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-card">
                      <div
                        className="h-full rounded-full bg-secondary"
                        style={{ width: `${(cantidad / maxEspecie) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {scope === "grupo" && (
              <>
                <h2 className="mt-6 text-xs font-medium uppercase tracking-wide text-ink-soft">
                  Por cazador
                </h2>
                <div className="mt-2 flex flex-col gap-2">
                  {porPersona.map(({ usuario, capturas: c, dias }) => (
                    <div
                      key={usuario.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-bg-card p-3 text-sm"
                    >
                      <span className="text-ink">{usuario.nombre}</span>
                      <span className="text-ink-soft">
                        🐗 {c} · 📅 {dias}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
