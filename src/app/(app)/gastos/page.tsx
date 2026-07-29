"use client";

import { useEffect, useMemo, useState } from "react";
import { listGastos, crearGasto, borrarGasto } from "@/lib/data/gastos";
import { listUsuarios, type UsuarioBasico } from "@/lib/data/usuarios";
import { startSyncTriggers } from "@/lib/sync/sync-manager";
import type { GastoRow } from "@/lib/offline/db";
import { GastoForm, type GastoFormValues } from "@/components/gastos/GastoForm";
import { SyncBadge } from "@/components/map/SyncBadge";
import { formatFecha } from "@/lib/format";
import { usePaginado } from "@/lib/hooks/usePaginado";
import { useUserId } from "@/lib/hooks/useUserId";

const formatoEuro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export default function GastosPage() {
  const [gastos, setGastos] = useState<GastoRow[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioBasico[]>([]);
  const userId = useUserId();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startSyncTriggers();
    (async () => {
      const [listaGastos, listaUsuarios] = await Promise.all([listGastos(), listUsuarios()]);
      setGastos(listaGastos);
      setUsuarios(listaUsuarios);
      setLoading(false);
    })();
  }, []);

  const nombrePorId = useMemo(
    () => Object.fromEntries(usuarios.map((u) => [u.id, u.nombre])),
    [usuarios]
  );

  const total = useMemo(() => gastos.reduce((acc, g) => acc + g.importe, 0), [gastos]);

  const totalPorPersona = useMemo(() => {
    const acc = new Map<string, number>();
    for (const g of gastos) {
      acc.set(g.pagado_por, (acc.get(g.pagado_por) ?? 0) + g.importe);
    }
    return usuarios
      .map((u) => ({ usuario: u, total: acc.get(u.id) ?? 0 }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [gastos, usuarios]);

  const totalPorProveedor = useMemo(() => {
    const acc = new Map<string, number>();
    for (const g of gastos) {
      if (!g.proveedor) continue;
      acc.set(g.proveedor, (acc.get(g.proveedor) ?? 0) + g.importe);
    }
    return Array.from(acc.entries())
      .map(([proveedor, total]) => ({ proveedor, total }))
      .sort((a, b) => b.total - a.total);
  }, [gastos]);

  async function handleSubmit(values: GastoFormValues) {
    setFormError(null);
    try {
      const row = await crearGasto(values);
      setGastos((prev) => [row, ...prev]);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se ha podido guardar");
    }
  }

  async function handleDelete(id: string) {
    await borrarGasto(id);
    setGastos((prev) => prev.filter((g) => g.id !== id));
  }

  // Los totales de arriba siempre se calculan sobre "gastos" completo — solo
  // la lista de abajo se pagina para no pintar de golpe todo el histórico.
  const { visibles: gastosVisibles, hayMas, mostrarMas } = usePaginado(gastos);

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="pointer-events-none sticky top-0 z-20 flex justify-center px-3 pt-3">
        <SyncBadge />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <h1 className="text-xl font-semibold text-ink">Gastos</h1>

        {!loading && gastos.length > 0 && (
          <div className="mt-4 rounded-xl border border-border bg-bg-card p-3">
            <p className="text-sm text-ink-soft">Total gastado</p>
            <p className="text-xl font-semibold text-ink">{formatoEuro.format(total)}</p>
            {totalPorPersona.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {totalPorPersona.map(({ usuario, total: t }) => (
                  <span
                    key={usuario.id}
                    className="rounded-full border border-border bg-bg px-3 py-1 text-xs text-ink-soft"
                  >
                    {usuario.nombre}: {formatoEuro.format(t)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && totalPorProveedor.length > 1 && (
          <div className="mt-3 rounded-xl border border-border bg-bg-card p-3">
            <p className="text-sm text-ink-soft">Por proveedor</p>
            <div className="mt-2 flex flex-col gap-1">
              {totalPorProveedor.map(({ proveedor, total: t }) => (
                <div key={proveedor} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{proveedor}</span>
                  <span className="text-ink-soft">{formatoEuro.format(t)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <p className="mt-4 text-sm text-ink-soft">Cargando…</p>}

        {!loading && gastos.length === 0 && (
          <p className="mt-4 text-sm text-ink-soft">
            Nada registrado todavía. Toca el botón + de abajo para añadir el primero.
          </p>
        )}

        <ul className="mt-4 flex flex-col gap-2">
          {gastosVisibles.map((g) => (
            <li key={g.id} className="rounded-xl border border-border bg-bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-sm font-medium text-ink">
                    {g.concepto} · {formatoEuro.format(g.importe)}
                  </span>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {formatFecha(g.fecha)} · Pagado por {nombrePorId[g.pagado_por] ?? "—"}
                    {g.proveedor && ` · ${g.proveedor}`}
                  </p>
                  {g.notas && <p className="mt-1 text-sm text-ink-soft">{g.notas}</p>}
                </div>
                {(g.registrado_por === userId || g.pagado_por === userId) && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(g.id)}
                    className="shrink-0 -m-2 p-2 text-xs text-alert"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </li>
          ))}
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

      <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-20">
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setShowForm(true);
          }}
          aria-label="Añadir gasto"
          title="Añadir gasto"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl leading-none text-white shadow-lg"
        >
          +
        </button>
      </div>

      {showForm && (
        <GastoForm
          usuarios={usuarios}
          usuarioActualId={userId}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          error={formError}
        />
      )}
    </div>
  );
}
