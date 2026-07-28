import { createClient } from "@/lib/supabase/client";
import { getDb, type EsperaRow } from "@/lib/offline/db";
import { trySync } from "@/lib/sync/sync-manager";

export interface NuevaEspera {
  puesto_id: string;
  cazador_id: string;
  fecha: string; // YYYY-MM-DD
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

export async function listEsperas(): Promise<EsperaRow[]> {
  const db = getDb();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("esperas")
    .select("*")
    .order("fecha", { ascending: false });

  if (!error && data) {
    await db.esperas.bulkPut(data);
    return data;
  }

  const cached = await db.esperas.toArray();
  return cached.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export async function crearEspera(input: NuevaEspera): Promise<EsperaRow> {
  const db = getDb();
  const asignado_por = await currentUserId();

  const row: EsperaRow = {
    id: crypto.randomUUID(),
    puesto_id: input.puesto_id,
    cazador_id: input.cazador_id,
    fecha: input.fecha,
    notas: input.notas,
    asignado_por,
    fecha_registro: new Date().toISOString(),
  };

  await db.esperas.put(row);
  await db.outbox.add({
    entity: "espera",
    op: "insert",
    rowId: row.id,
    payload: row,
    createdAt: Date.now(),
  });

  // A diferencia de las demás entidades, aquí sí esperamos a que intente
  // sincronizar: hay una restricción de "un cazador por puesto y fecha" en
  // el servidor, y queremos poder avisar en el momento si ya está cogido
  // (cuando hay conexión; sin conexión no hay forma de saberlo hasta luego).
  await trySync();
  const fallo = await db.syncErrors.where("rowId").equals(row.id).last();
  if (fallo) {
    await db.esperas.delete(row.id);
    await db.syncErrors.delete(fallo.id!);
    const duplicado = /duplicate|unique|ya existe/i.test(fallo.message);
    throw new Error(duplicado ? "Ese puesto ya está asignado ese día." : fallo.message);
  }

  return row;
}

export async function borrarEspera(id: string): Promise<void> {
  const db = getDb();
  await db.esperas.delete(id);
  await db.outbox.add({
    entity: "espera",
    op: "delete",
    rowId: id,
    payload: {},
    createdAt: Date.now(),
  });

  void trySync();
}
