"use client";

import type { ActividadRow, CapturaRow, EsperaRow } from "@/lib/offline/db";
import type { UsuarioBasico } from "@/lib/data/usuarios";
import { TIPO_ACTIVIDAD_LABEL } from "@/components/map/icons";
import { BottomSheet } from "@/components/BottomSheet";

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
  usuarios,
  asistentesIds,
  cambiandoAsistenciaId,
  onToggleAsistencia,
  onAnadirActividad,
  capturas,
  actividades,
  esperas,
  nombres,
  puntoNombrePorId,
  onClose,
}: {
  fecha: string;
  usuarios: UsuarioBasico[];
  asistentesIds: Set<string>;
  cambiandoAsistenciaId: string | null;
  onToggleAsistencia: (cazadorId: string) => void;
  onAnadirActividad: () => void;
  capturas: CapturaRow[];
  actividades: ActividadRow[];
  esperas: EsperaRow[];
  nombres: Record<string, string>;
  puntoNombrePorId: Record<string, string>;
  onClose: () => void;
}) {
  const hayAlgo = capturas.length > 0 || actividades.length > 0 || esperas.length > 0;

  return (
    <BottomSheet onBackdropClick={onClose} scrollable>
      <h2 className="text-base font-semibold text-ink">{formatFechaLarga(fecha)}</h2>

      <div className="mt-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-ink-soft">Van</h3>
        <div className="mt-1 flex flex-wrap gap-2">
          {usuarios.map((u) => {
            const activo = asistentesIds.has(u.id);
            return (
              <button
                key={u.id}
                type="button"
                disabled={cambiandoAsistenciaId === u.id}
                onClick={() => onToggleAsistencia(u.id)}
                className={`rounded-full border px-3 py-2 text-sm font-medium disabled:opacity-60 ${
                  activo ? "border-primary bg-primary/10 text-primary" : "border-border text-ink-soft"
                }`}
              >
                {activo ? "✓ " : ""}
                {u.nombre}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onAnadirActividad}
        className="mt-4 w-full rounded-lg border border-primary/30 px-4 py-3 text-sm font-medium text-primary"
      >
        🧰 Añadir actividad
      </button>

      {!hayAlgo && <p className="mt-4 text-sm text-ink-soft">Nada registrado este día.</p>}

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
                <span className="text-ink-soft">{nombres[c.cazador_id] ?? "—"}</span>
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
          <h3 className="text-xs font-medium uppercase tracking-wide text-ink-soft">Puestos</h3>
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
    </BottomSheet>
  );
}
