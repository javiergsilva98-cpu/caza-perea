import { createClient } from "@/lib/supabase/client";
import { getDb, type JornadaRow } from "@/lib/offline/db";
import { trySync } from "@/lib/sync/sync-manager";

export async function listJornadas(): Promise<JornadaRow[]> {
  const db = getDb();
  const supabase = createClient();

  const { data, error } = await supabase.from("jornadas").select("*");

  if (!error && data) {
    await db.jornadas.bulkPut(data);
    return data;
  }

  return db.jornadas.toArray();
}

// Una jornada tiene como mucho una foto: si ya existe fila para esa fecha
// se actualiza, si no se crea. La foto es del grupo, la puede poner o
// cambiar cualquiera, no solo quien la creó.
export async function guardarFotoJornada(fecha: string, foto_url: string): Promise<JornadaRow> {
  const db = getDb();
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");

  const existente = await db.jornadas.where("fecha").equals(fecha).first();

  if (existente) {
    const row: JornadaRow = { ...existente, foto_url };
    await db.jornadas.put(row);
    await db.outbox.add({
      entity: "jornada",
      op: "update",
      rowId: row.id,
      payload: { foto_url },
      createdAt: Date.now(),
    });
    void trySync();
    return row;
  }

  const row: JornadaRow = {
    id: crypto.randomUUID(),
    fecha,
    foto_url,
    registrado_por: session.user.id,
    fecha_registro: new Date().toISOString(),
  };
  await db.jornadas.put(row);
  await db.outbox.add({
    entity: "jornada",
    op: "insert",
    rowId: row.id,
    payload: row,
    createdAt: Date.now(),
  });
  void trySync();
  return row;
}
