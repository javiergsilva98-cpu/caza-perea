"use client";

import { useEffect, useMemo, useState } from "react";
import { listAsistencias, marcarAsistencia, quitarAsistencia } from "@/lib/data/calendario";
import { listCapturas } from "@/lib/data/capturas";
import { listActividades } from "@/lib/data/actividades";
import { listEsperas } from "@/lib/data/esperas";
import { listPuntosInteres } from "@/lib/data/puntos-interes";
import { listUsuarios, type UsuarioBasico } from "@/lib/data/usuarios";
import { startSyncTriggers } from "@/lib/sync/sync-manager";
import { createClient } from "@/lib/supabase/client";
import type { ActividadRow, CalendarioAsistenciaRow, CapturaRow, EsperaRow } from "@/lib/offline/db";
import { construirMes, NOMBRE_MES, DIA_SEMANA_CORTO } from "@/lib/calendario-utils";
import { DiaDetalle } from "@/components/calendario/DiaDetalle";
import { SyncBadge } from "@/components/map/SyncBadge";

export default function CalendarioPage() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());

  const [asistencias, setAsistencias] = useState<CalendarioAsistenciaRow[]>([]);
  const [capturas, setCapturas] = useState<CapturaRow[]>([]);
  const [actividades, setActividades] = useState<ActividadRow[]>([]);
  const [esperas, setEsperas] = useState<EsperaRow[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioBasico[]>([]);
  const [puntoNombrePorId, setPuntoNombrePorId] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [cambiandoAsistencia, setCambiandoAsistencia] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startSyncTriggers();
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserId(session?.user.id ?? null);

      const [listaAsistencias, listaCapturas, listaActividades, listaEsperas, listaUsuarios, listaPuntos] =
        await Promise.all([
          listAsistencias(),
          listCapturas(),
          listActividades(),
          listEsperas(),
          listUsuarios(),
          listPuntosInteres(),
        ]);
      setAsistencias(listaAsistencias);
      setCapturas(listaCapturas);
      setActividades(listaActividades);
      setEsperas(listaEsperas);
      setUsuarios(listaUsuarios);
      setPuntoNombrePorId(Object.fromEntries(listaPuntos.map((p) => [p.id, p.nombre])));
      setLoading(false);
    })();
  }, []);

  const nombrePorId = useMemo(
    () => Object.fromEntries(usuarios.map((u) => [u.id, u.nombre])),
    [usuarios]
  );

  const semanas = useMemo(() => construirMes(anio, mes), [anio, mes]);

  function cambiarMes(delta: number) {
    const nuevo = new Date(anio, mes + delta, 1);
    setAnio(nuevo.getFullYear());
    setMes(nuevo.getMonth());
  }

  function asistentesDe(fecha: string) {
    return asistencias
      .filter((a) => a.fecha === fecha)
      .map((a) => ({ id: a.cazador_id, nombre: nombrePorId[a.cazador_id] ?? "—" }));
  }

  async function handleToggleAsistencia() {
    if (!diaSeleccionado || !userId) return;
    const mia = asistencias.find((a) => a.fecha === diaSeleccionado && a.cazador_id === userId);
    setCambiandoAsistencia(true);
    try {
      if (mia) {
        await quitarAsistencia(mia.id);
        setAsistencias((prev) => prev.filter((a) => a.id !== mia.id));
      } else {
        const row = await marcarAsistencia(diaSeleccionado);
        setAsistencias((prev) => [...prev, row]);
      }
    } finally {
      setCambiandoAsistencia(false);
    }
  }

  const dia = diaSeleccionado
    ? {
        fecha: diaSeleccionado,
        capturas: capturas.filter((c) => c.fecha === diaSeleccionado),
        actividades: actividades.filter((a) => a.fecha === diaSeleccionado),
        esperas: esperas.filter((e) => e.fecha === diaSeleccionado),
        asistentes: asistentesDe(diaSeleccionado),
      }
    : null;

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="pointer-events-none sticky top-0 z-20 flex justify-center px-3 pt-3">
        <SyncBadge />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <h1 className="text-xl font-semibold text-ink">Calendario</h1>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => cambiarMes(-1)}
            aria-label="Mes anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink"
          >
            ‹
          </button>
          <p className="text-sm font-medium capitalize text-ink">
            {NOMBRE_MES[mes]} {anio}
          </p>
          <button
            type="button"
            onClick={() => cambiarMes(1)}
            aria-label="Mes siguiente"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink"
          >
            ›
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-ink-soft">Cargando…</p>
        ) : (
          <div className="mt-3">
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-soft">
              {DIA_SEMANA_CORTO.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="mt-1 flex flex-col gap-1">
              {semanas.map((semana, i) => (
                <div key={i} className="grid grid-cols-7 gap-1">
                  {semana.map((d, j) => {
                    if (!d) return <div key={j} />;
                    const asistentesDia = asistentesDe(d.fecha);
                    const yoVoy = !!userId && asistentesDia.some((a) => a.id === userId);
                    const otrosVan = asistentesDia.some((a) => a.id !== userId);
                    const hayCaptura = capturas.some((c) => c.fecha === d.fecha);
                    const hayActividad =
                      actividades.some((a) => a.fecha === d.fecha) ||
                      esperas.some((e) => e.fecha === d.fecha);
                    return (
                      <button
                        key={j}
                        type="button"
                        onClick={() => setDiaSeleccionado(d.fecha)}
                        className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-sm ${
                          d.esHoy ? "border border-primary" : ""
                        } ${yoVoy ? "bg-primary/15 font-semibold text-primary" : "text-ink"}`}
                      >
                        <span>{d.numero}</span>
                        <span className="flex h-1.5 gap-0.5">
                          {otrosVan && <span className="h-1.5 w-1.5 rounded-full bg-ink-soft" />}
                          {hayCaptura && <span className="h-1.5 w-1.5 rounded-full bg-marker" />}
                          {hayActividad && <span className="h-1.5 w-1.5 rounded-full bg-secondary" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-soft">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary/40" /> Voy yo
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-ink-soft" /> Van otros
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-marker" /> Captura
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> Actividad/espera
              </span>
            </div>
          </div>
        )}
      </div>

      {dia && (
        <DiaDetalle
          fecha={dia.fecha}
          asistentes={dia.asistentes}
          yoAsisto={!!userId && dia.asistentes.some((a) => a.id === userId)}
          cambiandoAsistencia={cambiandoAsistencia}
          onToggleAsistencia={() => void handleToggleAsistencia()}
          capturas={dia.capturas}
          actividades={dia.actividades}
          esperas={dia.esperas}
          nombres={nombrePorId}
          puntoNombrePorId={puntoNombrePorId}
          onClose={() => setDiaSeleccionado(null)}
        />
      )}
    </div>
  );
}
