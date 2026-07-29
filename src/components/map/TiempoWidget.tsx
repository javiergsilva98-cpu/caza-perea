"use client";

import { useEffect, useState } from "react";
import { obtenerTiempo, iconoTiempo, type Tiempo } from "@/lib/weather";
import { BottomSheet } from "@/components/BottomSheet";

function formatDia(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short" });
}

export function TiempoWidget() {
  const [tiempo, setTiempo] = useState<Tiempo | null>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    obtenerTiempo().then(setTiempo);
  }, []);

  if (!tiempo) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-border bg-bg-card px-3 py-1.5 text-sm font-medium text-ink shadow"
      >
        <span className="text-base leading-none">{iconoTiempo(tiempo.codigoActual)}</span>
        {tiempo.temperaturaActual}°
      </button>

      {abierto && (
        <BottomSheet onBackdropClick={() => setAbierto(false)}>
          <h2 className="text-base font-semibold text-ink">Tiempo en el coto</h2>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-4xl leading-none">{iconoTiempo(tiempo.codigoActual)}</span>
            <div>
              <p className="text-2xl font-semibold text-ink">{tiempo.temperaturaActual}°</p>
              <p className="text-xs text-ink-soft">Viento {tiempo.vientoActual} km/h</p>
            </div>
          </div>

          <div className="mt-4 flex justify-between gap-1">
            {tiempo.dias.map((d) => (
              <div key={d.fecha} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs capitalize text-ink-soft">{formatDia(d.fecha)}</span>
                <span className="text-xl leading-none">{iconoTiempo(d.codigo)}</span>
                <span className="text-xs text-ink">{d.max}°</span>
                <span className="text-xs text-ink-soft">{d.min}°</span>
                {d.probPrecipitacion > 0 && (
                  <span className="text-[10px] text-ink-soft">💧{d.probPrecipitacion}%</span>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="mt-5 w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink"
          >
            Cerrar
          </button>
        </BottomSheet>
      )}
    </>
  );
}
