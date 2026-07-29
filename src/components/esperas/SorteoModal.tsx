"use client";

import { useMemo, useState } from "react";
import type { EsperaRow, PuntoInteresRow } from "@/lib/offline/db";
import type { UsuarioBasico } from "@/lib/data/usuarios";
import { hoyISO } from "@/lib/format";

function barajar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

interface Asignacion {
  puesto: PuntoInteresRow;
  cazador: UsuarioBasico;
}

export function SorteoModal({
  puestos,
  usuarios,
  esperasExistentes,
  onGuardar,
  onCancel,
}: {
  puestos: PuntoInteresRow[];
  usuarios: UsuarioBasico[];
  esperasExistentes: EsperaRow[];
  onGuardar: (asignaciones: { puesto_id: string; cazador_id: string; fecha: string }[]) => Promise<void>;
  onCancel: () => void;
}) {
  const [fecha, setFecha] = useState(hoyISO());
  const [puestosSeleccionados, setPuestosSeleccionados] = useState<Set<string>>(
    () => new Set(puestos.map((p) => p.id))
  );
  const [cazadoresSeleccionados, setCazadoresSeleccionados] = useState<Set<string>>(
    () => new Set(usuarios.map((u) => u.id))
  );
  const [resultado, setResultado] = useState<Asignacion[] | null>(null);
  const [sinPuesto, setSinPuesto] = useState<UsuarioBasico[]>([]);
  const [sinCazador, setSinCazador] = useState<PuntoInteresRow[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const puestosOcupadosEseDia = useMemo(
    () => new Set(esperasExistentes.filter((e) => e.fecha === fecha).map((e) => e.puesto_id)),
    [esperasExistentes, fecha]
  );

  const puestosDisponiblesEseDia = useMemo(
    () => puestos.filter((p) => !puestosOcupadosEseDia.has(p.id)),
    [puestos, puestosOcupadosEseDia]
  );

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
    const copia = new Set(set);
    if (copia.has(id)) copia.delete(id);
    else copia.add(id);
    setter(copia);
  }

  function sortear() {
    const puestosElegidos = barajar(puestosDisponiblesEseDia.filter((p) => puestosSeleccionados.has(p.id)));
    const cazadoresElegidos = barajar(usuarios.filter((u) => cazadoresSeleccionados.has(u.id)));
    const n = Math.min(puestosElegidos.length, cazadoresElegidos.length);
    const asignaciones: Asignacion[] = [];
    for (let i = 0; i < n; i++) {
      asignaciones.push({ puesto: puestosElegidos[i], cazador: cazadoresElegidos[i] });
    }
    setResultado(asignaciones);
    setSinCazador(puestosElegidos.slice(n));
    setSinPuesto(cazadoresElegidos.slice(n));
    setError(null);
  }

  async function guardar() {
    if (!resultado) return;
    setGuardando(true);
    setError(null);
    try {
      await onGuardar(
        resultado.map((a) => ({ puesto_id: a.puesto.id, cazador_id: a.cazador.id, fecha }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido guardar el sorteo");
    } finally {
      setGuardando(false);
    }
  }

  if (puestos.length === 0) {
    return (
      <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40">
        <div className="rounded-t-2xl bg-bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <p className="text-sm text-ink-soft">
            Todavía no hay ningún puesto creado en el mapa para poder sortear.
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40">
      <div className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-soft/30" />
        <h2 className="text-base font-semibold text-ink">🎲 Sortear puestos</h2>

        {!resultado ? (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="sorteo-fecha" className="text-sm font-medium text-ink">
                Fecha
              </label>
              <input
                id="sorteo-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="rounded-lg border border-border bg-bg-card px-4 py-3 text-base text-ink outline-none focus:border-primary"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-ink">
                Puestos ({puestosDisponiblesEseDia.length} libres ese día)
              </p>
              <div className="mt-2 flex flex-col gap-1">
                {puestos.map((p) => {
                  const ocupado = puestosOcupadosEseDia.has(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-2 text-sm ${ocupado ? "text-ink-soft/50" : "text-ink"}`}
                    >
                      <input
                        type="checkbox"
                        disabled={ocupado}
                        checked={!ocupado && puestosSeleccionados.has(p.id)}
                        onChange={() => toggle(puestosSeleccionados, setPuestosSeleccionados, p.id)}
                      />
                      {p.nombre}
                      {ocupado && " (ya asignado ese día)"}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-ink">Cazadores</p>
              <div className="mt-2 flex flex-col gap-1">
                {usuarios.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={cazadoresSeleccionados.has(u.id)}
                      onChange={() => toggle(cazadoresSeleccionados, setCazadoresSeleccionados, u.id)}
                    />
                    {u.nombre}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={sortear}
                disabled={puestosSeleccionados.size === 0 || cazadoresSeleccionados.size === 0}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                Sortear
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {resultado.map((a) => (
                <li
                  key={a.puesto.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                >
                  <span className="text-ink">🪑 {a.puesto.nombre}</span>
                  <span className="font-medium text-primary">{a.cazador.nombre}</span>
                </li>
              ))}
            </ul>

            {sinPuesto.length > 0 && (
              <p className="text-xs text-ink-soft">
                Sin puesto (más cazadores que puestos libres): {sinPuesto.map((c) => c.nombre).join(", ")}
              </p>
            )}
            {sinCazador.length > 0 && (
              <p className="text-xs text-ink-soft">
                Puestos libres sin cubrir: {sinCazador.map((p) => p.nombre).join(", ")}
              </p>
            )}

            {error && <p className="text-sm text-alert">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResultado(null)}
                className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink"
              >
                Repetir sorteo
              </button>
              <button
                type="button"
                onClick={() => void guardar()}
                disabled={guardando}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
