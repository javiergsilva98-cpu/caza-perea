"use client";

import type { ActividadRow, CapturaRow, EsperaRow } from "@/lib/offline/db";

const TIPO_ACTIVIDAD_LABEL: Record<string, string> = {
  rellenado: "Rellenado",
  revision: "Revisión",
  reparacion: "Reparación",
  otro: "Otro",
};

function formatFechaLarga(fecha: string) {
  const texto = new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function DiaDetalle({
  fecha,
  asistentes,
  yoAsisto,
  cambiandoAsistencia,
  onToggleAsistencia,
  capturas,
  actividades,
  esperas,
  nombres,
  puntoNombrePorId,
  onClose,
}: {
  fecha: string;
  asistentes: { id: string; nombre: string }[];
  yoAsisto: boolean;
  cambiandoAsistencia: boolean;
  onToggleAsistencia: () => void;
  capturas: CapturaRow[];
  actividades: ActividadRow[];
  esperas: EsperaRow[];
  nombres: Record<string, string>;
  puntoNombrePorId: Record<string, string>;
  onClose: () => void;
}) {
  const hayAlgo = capturas.length > 0 || actividades.length > 0 || esperas.length > 0;

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div
        className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-soft/30" />
        <h2 className="text-base font-semibold text-ink">{formatFechaLarga(fecha)}</h2>

        <button
          type="button"
          onClick={onToggleAsistencia}
          disabled={cambiandoAsistencia}
          className={`mt-4 w-full rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-60 ${
            yoAsisto ? "border border-alert text-alert" : "bg-primary text-white"
          }`}
        >
          {cambiandoAsistencia ? "Guardando…" : yoAsisto ? "No voy" : "Marcar que voy"}
        </button>

        <div className="mt-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-ink-soft">Van</h3>
          {asistentes.length === 0 ? (
            <p className="mt-1 text-sm text-ink-soft">Nadie marcado todavía.</p>
          ) : (
            <div className="mt-1 flex flex-wrap gap-2">
              {asistentes.map((a) => (
                <span
                  key={a.id}
                  className="rounded-full border border-border bg-bg px-3 py-1 text-xs text-ink"
                >
                  {a.nombre}
                </span>
              ))}
            </div>
          )}
        </div>

        {!hayAlgo && (
          <p className="mt-4 text-sm text-ink-soft">Nada registrado este día.</p>
        )}

        {capturas.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-ink-soft">
              Capturas y avistamientos
            </h3>
            <ul className="mt-1 flex flex-col gap-1">
              {capturas.map((c) => (
                <li key={c.id} className="text-sm text-ink">
                  {c.tipo === "captura" ? "🐗" : "👁"} {c.especie}
                  {c.cantidad > 1 ? ` ×${c.cantidad}` : ""} —{" "}
                  <span className="text-ink-soft">{nombres[c.registrado_por] ?? "—"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {actividades.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-ink-soft">Actividad</h3>
            <ul className="mt-1 flex flex-col gap-1">
              {actividades.map((a) => (
                <li key={a.id} className="text-sm text-ink">
                  🧰 {TIPO_ACTIVIDAD_LABEL[a.tipo] ?? a.tipo} ·{" "}
                  {puntoNombrePorId[a.punto_interes_id] ?? "Punto eliminado"} —{" "}
                  <span className="text-ink-soft">{nombres[a.realizado_por] ?? "—"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {esperas.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-ink-soft">Esperas</h3>
            <ul className="mt-1 flex flex-col gap-1">
              {esperas.map((e) => (
                <li key={e.id} className="text-sm text-ink">
                  🪑 {puntoNombrePorId[e.puesto_id] ?? "Puesto eliminado"} —{" "}
                  <span className="text-ink-soft">{nombres[e.cazador_id] ?? "—"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
