"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listItemsLista,
  crearItemLista,
  editarItemLista,
  borrarItemLista,
  reiniciarLista,
} from "@/lib/data/lista-maleta";
import { listUsuarios, type UsuarioBasico } from "@/lib/data/usuarios";
import { startSyncTriggers } from "@/lib/sync/sync-manager";
import { useUserId } from "@/lib/hooks/useUserId";
import type { ListaMaletaRow } from "@/lib/offline/db";
import { ListaItemForm, type ListaItemFormValues } from "@/components/lista/ListaItemForm";
import { SyncBadge } from "@/components/map/SyncBadge";

type FormState = { modo: "crear" } | { modo: "editar"; item: ListaMaletaRow };

export default function ListaMaletaPage() {
  const [items, setItems] = useState<ListaMaletaRow[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioBasico[]>([]);
  const userId = useUserId();
  const [formState, setFormState] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startSyncTriggers();
    (async () => {
      const [listaItems, listaUsuarios] = await Promise.all([listItemsLista(), listUsuarios()]);
      setItems(listaItems);
      setUsuarios(listaUsuarios);
      setLoading(false);
    })();
  }, []);

  // Pendientes primero, llevados al final — dentro de cada grupo se
  // mantiene el orden en que se añadieron (Array.sort es estable).
  const itemsOrdenados = useMemo(
    () => [...items].sort((a, b) => Number(a.hecho) - Number(b.hecho)),
    [items]
  );

  const hayLlevados = items.some((i) => i.hecho);

  async function handleSubmit(values: ListaItemFormValues) {
    if (!formState) return;
    setFormError(null);
    try {
      if (formState.modo === "crear") {
        const row = await crearItemLista(values);
        setItems((prev) => [...prev, row]);
      } else {
        const { item } = formState;
        await editarItemLista(item.id, values);
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...values } : i)));
      }
      setFormState(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se ha podido guardar");
    }
  }

  async function handleToggle(item: ListaMaletaRow) {
    const hecho = !item.hecho;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, hecho } : i)));
    await editarItemLista(item.id, { hecho });
  }

  async function handleResponsable(item: ListaMaletaRow, responsable: string) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, responsable } : i)));
    await editarItemLista(item.id, { responsable });
  }

  async function handleDelete(id: string) {
    await borrarItemLista(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleReiniciar() {
    const llevados = items.filter((i) => i.hecho);
    setItems((prev) => prev.map((i) => (i.hecho ? { ...i, hecho: false } : i)));
    await reiniciarLista(llevados);
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="pointer-events-none sticky top-0 z-20 flex justify-center px-3 pt-3">
        <SyncBadge />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-ink">Maleta</h1>
          {hayLlevados && (
            <button
              type="button"
              onClick={() => void handleReiniciar()}
              className="text-xs font-medium text-ink-soft"
            >
              Reiniciar lista
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          Lo que hay que llevar al coto. Compartida entre los tres.
        </p>

        {loading && <p className="mt-4 text-sm text-ink-soft">Cargando…</p>}

        {!loading && items.length === 0 && (
          <p className="mt-4 text-sm text-ink-soft">
            Nada en la lista todavía. Toca el botón + de abajo para añadir el primero.
          </p>
        )}

        <ul className="mt-4 flex flex-col gap-2">
          {itemsOrdenados.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-bg-card p-3"
            >
              <button
                type="button"
                onClick={() => void handleToggle(item)}
                aria-label={item.hecho ? "Marcar como pendiente" : "Marcar como llevado"}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm ${
                  item.hecho ? "border-primary bg-primary text-white" : "border-border text-transparent"
                }`}
              >
                ✓
              </button>

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setFormState({ modo: "editar", item });
                  }}
                  className="block w-full text-left"
                >
                  <p className={`text-sm text-ink ${item.hecho ? "text-ink-soft line-through" : ""}`}>
                    {item.texto}
                  </p>
                  {item.notas && <p className="mt-0.5 text-xs text-ink-soft">{item.notas}</p>}
                </button>
                <select
                  value={item.responsable}
                  onChange={(e) => void handleResponsable(item, e.target.value)}
                  // text-base (16px): por debajo de eso Safari hace zoom
                  // automático de toda la página al enfocar el desplegable.
                  className="mt-1 rounded-md border border-border bg-bg px-2 py-1 text-base text-ink-soft outline-none"
                >
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      Lleva: {u.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {item.creado_por === userId && (
                <button
                  type="button"
                  onClick={() => void handleDelete(item.id)}
                  className="shrink-0 -m-2 p-2 text-xs text-alert"
                >
                  Borrar
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-20">
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setFormState({ modo: "crear" });
          }}
          aria-label="Añadir ítem"
          title="Añadir ítem"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl leading-none text-white shadow-lg"
        >
          +
        </button>
      </div>

      {formState && (
        <ListaItemForm
          titulo={formState.modo === "crear" ? "Nuevo ítem" : "Editar ítem"}
          inicial={
            formState.modo === "editar"
              ? {
                  texto: formState.item.texto,
                  responsable: formState.item.responsable,
                  notas: formState.item.notas,
                }
              : undefined
          }
          usuarios={usuarios}
          usuarioActualId={userId}
          onSubmit={handleSubmit}
          onCancel={() => setFormState(null)}
          error={formError}
        />
      )}
    </div>
  );
}
