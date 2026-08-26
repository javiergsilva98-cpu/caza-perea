"use client";

import { useEffect, useMemo, useState } from "react";
import { listCapturas, crearCaptura } from "@/lib/data/capturas";
import { listJornadaAsistentes } from "@/lib/data/jornada-asistentes";
import { listJornadas } from "@/lib/data/jornadas";
import { listUsuarios, listUsuariosNombres, type UsuarioBasico } from "@/lib/data/usuarios";
import { startSyncTriggers } from "@/lib/sync/sync-manager";
import type { CapturaRow, JornadaAsistenteRow, JornadaRow } from "@/lib/offline/db";
import { DiaCapturasForm } from "@/components/capturas/DiaCapturasForm";
import { CapturaForm, type CapturaFormValues } from "@/components/capturas/CapturaForm";
import { PegarUbicacionForm } from "@/components/map/PegarUbicacionForm";
import { SyncBadge } from "@/components/map/SyncBadge";
import type { Coords } from "@/lib/geo/google-maps";
import { formatFecha, hoyISO } from "@/lib/format";
import { iconoEspecie } from "@/lib/capturas-especies";
import { usePaginado } from "@/lib/hooks/usePaginado";
import { useUserId } from "@/lib/hooks/useUserId";

interface DiaCaptura {
  fecha: string;
  asistentes: JornadaAsistenteRow[];
  capturas: CapturaRow[];
  fotoUrl: string | null;
}

function agruparPorCazador(capturas: CapturaRow[]): { cazadorId: string; entradas: CapturaRow[] }[] {
  const acc = new Map<string, CapturaRow[]>();
  for (const c of capturas) {
    acc.set(c.cazador_id, [...(acc.get(c.cazador_id) ?? []), c]);
  }
  return Array.from(acc.entries()).map(([cazadorId, entradas]) => ({ cazadorId, entradas }));
}

export default function CapturasPage() {
  const [capturas, setCapturas] = useState<CapturaRow[]>([]);
  const [asistentes, setAsistentes] = useState<JornadaAsistenteRow[]>([]);
  const [jornadas, setJornadas] = useState<JornadaRow[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioBasico[]>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const userId = useUserId();
  const [diaAbierto, setDiaAbierto] = useState<string | null>(null);
  const [pegarUbicacionAbierto, setPegarUbicacionAbierto] = useState(false);
  const [ubicacionPendiente, setUbicacionPendiente] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startSyncTriggers();
    (async () => {
      const [listaCapturas, listaAsistentes, listaJornadas, listaUsuarios, mapaNombres] = await Promise.all([
        listCapturas(),
        listJornadaAsistentes(),
        listJornadas(),
        listUsuarios(),
        listUsuariosNombres(),
      ]);
      setCapturas(listaCapturas);
      setAsistentes(listaAsistentes);
      setJornadas(listaJornadas);
      setUsuarios(listaUsuarios);
      setNombres(mapaNombres);
      setLoading(false);
    })();
  }, []);

  const dias = useMemo<DiaCaptura[]>(() => {
    const fechas = new Set<string>([
      ...capturas.map((c) => c.fecha),
      ...asistentes.map((a) => a.fecha),
      ...jornadas.map((j) => j.fecha),
    ]);
    return Array.from(fechas)
      .map((fecha) => ({
        fecha,
        asistentes: asistentes.filter((a) => a.fecha === fecha),
        capturas: capturas.filter((c) => c.fecha === fecha),
        fotoUrl: jornadas.find((j) => j.fecha === fecha)?.foto_url ?? null,
      }))
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  }, [capturas, asistentes, jornadas]);

  const diaAbiertoDatos = dias.find((d) => d.fecha === diaAbierto);

  async function handleUbicacionSubmit(values: CapturaFormValues) {
    if (!ubicacionPendiente) return;
    const row = await crearCaptura({
      ...values,
      lat: ubicacionPendiente.lat,
      lng: ubicacionPendiente.lng,
    });
    setCapturas((prev) => [row, ...prev]);
  }

  function handleUbicacionResuelta(coords: Coords) {
    setUbicacionPendiente(coords);
    setPegarUbicacionAbierto(false);
  }

  const { visibles: diasVisibles, hayMas, mostrarMas } = usePaginado(dias);

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="pointer-events-none sticky top-0 z-20 flex justify-center px-3 pt-3">
        <SyncBadge />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <h1 className="text-xl font-semibold text-ink">Jornadas de caza</h1>

        {loading && <p className="mt-4 text-sm text-ink-soft">Cargando…</p>}

        {!loading && dias.length === 0 && (
          <p className="mt-4 text-sm text-ink-soft">
            Nada registrado todavía. Toca el botón + de abajo para añadir el primer día.
          </p>
        )}

        <ul className="mt-4 flex flex-col gap-2">
          {diasVisibles.map((dia) => {
            const totalCapturas = dia.capturas
              .filter((c) => c.tipo === "captura")
              .reduce((acc, c) => acc + c.cantidad, 0);
            return (
              <li key={dia.fecha} className="rounded-xl border border-border bg-bg-card p-3">
                <button type="button" onClick={() => setDiaAbierto(dia.fecha)} className="flex w-full gap-3 text-left">
                  {dia.fotoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- URL de Supabase Storage
                    <img
                      src={dia.fotoUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {formatFecha(dia.fecha, { weekday: true, year: true })}
                    </span>
                    {totalCapturas > 0 && <span className="text-xs text-ink-soft">🐗 {totalCapturas}</span>}
                  </div>
                  {dia.asistentes.length > 0 && (
                    <p className="mt-0.5 text-xs text-ink-soft">
                      Estuvieron: {dia.asistentes.map((a) => nombres[a.cazador_id] ?? "—").join(", ")}
                    </p>
                  )}
                  {dia.capturas.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-soft">Sin capturas registradas.</p>
                  ) : (
                    <ul className="mt-2 flex flex-col gap-0.5">
                      {agruparPorCazador(dia.capturas).map(({ cazadorId, entradas }) => (
                        <li key={cazadorId} className="text-sm text-ink">
                          <span className="font-medium">{nombres[cazadorId] ?? "—"}:</span>{" "}
                          {entradas
                            .map(
                              (e) =>
                                `${e.tipo === "captura" ? iconoEspecie(e.especie) : "👁"} ${e.especie}${
                                  e.cantidad > 1 ? ` ×${e.cantidad}` : ""
                                }`
                            )
                            .join(", ")}
                        </li>
                      ))}
                    </ul>
                  )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {hayMas && (
          <button
            type="button"
            onClick={mostrarMas}
            className="mt-3 w-full rounded-lg border border-border py-2.5 text-sm font-medium text-ink-soft"
          >
            Mostrar más
          </button>
        )}
      </div>

      <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-20 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setPegarUbicacionAbierto(true)}
          aria-label="Añadir desde un enlace"
          title="Añadir desde un enlace"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg-card text-xl text-ink shadow"
        >
          📍
        </button>
        <button
          type="button"
          onClick={() => setDiaAbierto(hoyISO())}
          aria-label="Registrar día de caza"
          title="Registrar día de caza"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl leading-none text-white shadow-lg"
        >
          +
        </button>
      </div>

      {diaAbierto && (
        <DiaCapturasForm
          fechaInicial={diaAbierto}
          usuarios={usuarios}
          nombres={nombres}
          userId={userId}
          asistentes={diaAbiertoDatos?.asistentes ?? []}
          capturas={diaAbiertoDatos?.capturas ?? []}
          fotoJornada={diaAbiertoDatos?.fotoUrl ?? null}
          onAsistenteAgregado={(row) => setAsistentes((prev) => [...prev, row])}
          onAsistenteQuitado={(id) => setAsistentes((prev) => prev.filter((a) => a.id !== id))}
          onCapturaAgregada={(row) => setCapturas((prev) => [row, ...prev])}
          onCapturaBorrada={(id) => setCapturas((prev) => prev.filter((c) => c.id !== id))}
          onFotoJornadaActualizada={(row) =>
            setJornadas((prev) => [...prev.filter((j) => j.id !== row.id), row])
          }
          onCerrar={() => setDiaAbierto(null)}
        />
      )}

      {pegarUbicacionAbierto && (
        <PegarUbicacionForm
          onResolved={handleUbicacionResuelta}
          onCancel={() => setPegarUbicacionAbierto(false)}
        />
      )}

      {ubicacionPendiente && (
        <CapturaForm
          usuarios={usuarios}
          onSubmit={handleUbicacionSubmit}
          onCerrar={() => setUbicacionPendiente(null)}
        />
      )}
    </div>
  );
}
