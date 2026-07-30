"use client";

import { useEffect, useState } from "react";
import {
  obtenerTiempoCompleto,
  iconoTiempo,
  direccionCardinal,
  type TiempoCompleto,
} from "@/lib/weather";
import { SyncBadge } from "@/components/map/SyncBadge";

function formatHora(iso: string) {
  return iso.slice(11, 16);
}

function formatDia(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default function TiempoPage() {
  const [tiempo, setTiempo] = useState<TiempoCompleto | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerTiempoCompleto().then((t) => {
      setTiempo(t);
      setCargando(false);
    });
  }, []);

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="pointer-events-none sticky top-0 z-20 flex justify-center px-3 pt-3">
        <SyncBadge />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <h1 className="text-xl font-semibold text-ink">Tiempo</h1>
        <p className="mt-1 text-sm text-ink-soft">
          En el coto CU10053 · datos de Open-Meteo, actualizados al abrir esta pantalla.
        </p>

        {cargando && <p className="mt-6 text-sm text-ink-soft">Cargando…</p>}

        {!cargando && !tiempo && (
          <p className="mt-6 text-sm text-ink-soft">
            No se ha podido obtener el tiempo — revisa la conexión e inténtalo de nuevo.
          </p>
        )}

        {tiempo && (
          <>
            <div className="mt-4 rounded-xl border border-border bg-bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl leading-none">{iconoTiempo(tiempo.actual.codigo)}</span>
                <div>
                  <p className="text-3xl font-semibold text-ink">{tiempo.actual.temperatura}°</p>
                  <p className="text-xs text-ink-soft">
                    Sensación {tiempo.actual.sensacionTermica}° · {tiempo.actual.esDeDia ? "De día" : "De noche"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-bg p-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-ink-soft">Humedad</p>
                  <p className="text-sm font-medium text-ink">{tiempo.actual.humedad}%</p>
                </div>
                <div className="rounded-lg bg-bg p-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-ink-soft">Nubosidad</p>
                  <p className="text-sm font-medium text-ink">{tiempo.actual.nubosidad}%</p>
                </div>
                <div className="rounded-lg bg-bg p-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-ink-soft">Presión</p>
                  <p className="text-sm font-medium text-ink">{tiempo.actual.presion} hPa</p>
                </div>
                <div className="rounded-lg bg-bg p-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-ink-soft">Viento</p>
                  <p className="text-sm font-medium text-ink">
                    {tiempo.actual.vientoVelocidad} km/h {direccionCardinal(tiempo.actual.vientoDireccion)}
                  </p>
                </div>
                <div className="rounded-lg bg-bg p-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-ink-soft">Ráfagas</p>
                  <p className="text-sm font-medium text-ink">{tiempo.actual.vientoRafagas} km/h</p>
                </div>
                <div className="rounded-lg bg-bg p-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-ink-soft">Índice UV</p>
                  <p className="text-sm font-medium text-ink">{tiempo.actual.uvIndex ?? "—"}</p>
                </div>
              </div>
              {tiempo.actual.precipitacion > 0 && (
                <p className="mt-3 text-center text-xs text-ink-soft">
                  💧 Precipitación actual: {tiempo.actual.precipitacion} mm
                </p>
              )}
            </div>

            <h2 className="mt-6 text-xs font-medium uppercase tracking-wide text-ink-soft">
              Próximas horas
            </h2>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
              {tiempo.horas.map((h) => (
                <div
                  key={h.hora}
                  className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-border bg-bg-card px-3 py-2"
                >
                  <span className="text-xs text-ink-soft">{formatHora(h.hora)}</span>
                  <span className="text-sm font-medium text-ink">{h.temperatura}°</span>
                  <span className="text-[10px] text-ink-soft">💧{h.probPrecipitacion}%</span>
                  <span className="text-[10px] text-ink-soft">🌬️{h.vientoVelocidad}</span>
                  <span className="text-[10px] text-ink-soft">☀️{h.uvIndex}</span>
                </div>
              ))}
            </div>

            <h2 className="mt-6 text-xs font-medium uppercase tracking-wide text-ink-soft">
              Próximos días
            </h2>
            <div className="mt-2 flex flex-col gap-2">
              {tiempo.dias.map((d) => (
                <div key={d.fecha} className="rounded-xl border border-border bg-bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-ink">{formatDia(d.fecha)}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-xl leading-none">{iconoTiempo(d.codigo)}</span>
                      <span className="text-sm text-ink">
                        {d.max}° / {d.min}°
                      </span>
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">
                    Sensación {d.sensacionMax}° / {d.sensacionMin}°
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-soft">
                    <span>💧 {d.probPrecipitacion}% ({d.precipitacionMm} mm, {d.horasPrecipitacion}h)</span>
                    <span>
                      🌬️ {d.vientoMax} km/h {direccionCardinal(d.direccionDominante)} (ráfagas {d.rafagasMax})
                    </span>
                    <span>
                      🌅 {formatHora(d.amanecer)} · 🌇 {formatHora(d.atardecer)}
                    </span>
                    <span>
                      ☀️ UV máx {d.uvMax} · {d.horasSol}h de sol
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
