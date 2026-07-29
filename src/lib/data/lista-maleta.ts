import { createClient } from "@/lib/supabase/client";
import { getDb, type ListaMaletaRow } from "@/lib/offline/db";
import { trySync } from "@/lib/sync/sync-manager";

export interface NuevoItemLista {
  texto: string;
  responsable: string;
  notas: string | null;
}

async function currentUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");
  return session.user.id;
}

export async function listItemsLista(): Promise<ListaMaletaRow[]> {
  const db = getDb();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("lista_maleta")
    .select("*")
    .order("fecha_creacion", { ascending: true });

  if (!error && data) {
    await db.listaMaleta.bulkPut(data);
    return data;
  }

  return db.listaMaleta.toArray();
}

export async function crearItemLista(input: NuevoItemLista): Promise<ListaMaletaRow> {
  const db = getDb();
  const creado_por = await currentUserId();

  const row: ListaMaletaRow = {
    id: crypto.randomUUID(),
    texto: input.texto,
    hecho: false,
    responsable: input.responsable,
    notas: input.notas,
    creado_por,
    fecha_creacion: new Date().toISOString(),
  };

  await db.listaMaleta.put(row);
  await db.outbox.add({
    entity: "item_lista",
    op: "insert",
    rowId: row.id,
    payload: row,
    createdAt: Date.now(),
  });

  void trySync();
  return row;
}

export async function editarItemLista(
  id: string,
  cambios: Partial<Pick<ListaMaletaRow, "hecho" | "responsable" | "texto" | "notas">>
): Promise<void> {
  const db = getDb();
  const existente = await db.listaMaleta.get(id);
  if (!existente) throw new Error("Ítem no encontrado en caché local");

  const actualizado: ListaMaletaRow = { ...existente, ...cambios };
  await db.listaMaleta.put(actualizado);
  await db.outbox.add({
    entity: "item_lista",
    op: "update",
    rowId: id,
    payload: cambios,
    createdAt: Date.now(),
  });

  void trySync();
}

export async function borrarItemLista(id: string): Promise<void> {
  const db = getDb();
  await db.listaMaleta.delete(id);
  await db.outbox.add({
    entity: "item_lista",
    op: "delete",
    rowId: id,
    payload: {},
    createdAt: Date.now(),
  });

  void trySync();
}

// Desmarca todos los ítems llevados, para volver a preparar la maleta de
// cara al siguiente fin de semana sin tener que reescribir la lista.
export async function reiniciarLista(items: ListaMaletaRow[]): Promise<void> {
  await Promise.all(
    items.filter((item) => item.hecho).map((item) => editarItemLista(item.id, { hecho: false }))
  );
}
