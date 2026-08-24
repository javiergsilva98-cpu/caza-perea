import { createClient } from "@/lib/supabase/client";
import { getDb, type JornadaAsistenteRow } from "@/lib/offline/db";
import { trySync } from "@/lib/sync/sync-manager";

export async function listJornadaAsistentes(): Promise<JornadaAsistenteRow[]> {
  const db = getDb();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("jornada_asistentes")
    .select("*")
    .order("fecha", { ascending: false });

  if (!error && data) {
    await db.jornadaAsistentes.bulkPut(data);
    return data;
  }

  return db.jornadaAsistentes.toArray();
}

// Idempotente: si ese cazador ya estaba marcado ese día, devuelve la fila
// existente en vez de duplicarla (la tabla tiene un unique (fecha, cazador_id)).
export async function marcarAsistente(
  fecha: string,
  cazador_id: string
): Promise<JornadaAsistenteRow> {
  const db = getDb();
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");

  const existente = await db.jornadaAsistentes
    .where("fecha")
    .equals(fecha)
    .filter((a) => a.cazador_id === cazador_id)
    .first();
  if (existente) return existente;

  const row: JornadaAsistenteRow = {
    id: crypto.randomUUID(),
    fecha,
    cazador_id,
    registrado_por: session.user.id,
    fecha_registro: new Date().toISOString(),
  };

  await db.jornadaAsistentes.put(row);
  await db.outbox.add({
    entity: "jornada_asistente",
    op: "insert",
    rowId: row.id,
    payload: row,
    createdAt: Date.now(),
  });

  void trySync();
  return row;
}

export async function quitarAsistente(id: string): Promise<void> {
  const db = getDb();
  await db.jornadaAsistentes.delete(id);
  await db.outbox.add({
    entity: "jornada_asistente",
    op: "delete",
    rowId: id,
    payload: {},
    createdAt: Date.now(),
  });

  void trySync();
}
