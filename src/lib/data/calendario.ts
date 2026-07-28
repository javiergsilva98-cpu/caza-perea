import { createClient } from "@/lib/supabase/client";
import { getDb, type CalendarioAsistenciaRow } from "@/lib/offline/db";
import { trySync } from "@/lib/sync/sync-manager";

async function currentUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");
  return session.user.id;
}

export async function listAsistencias(): Promise<CalendarioAsistenciaRow[]> {
  const db = getDb();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("calendario_asistencias")
    .select("*")
    .order("fecha", { ascending: true });

  if (!error && data) {
    await db.calendarioAsistencias.bulkPut(data);
    return data;
  }

  const cached = await db.calendarioAsistencias.toArray();
  return cached.sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
}

// Marca al usuario actual como que va ese día. No hace nada si ya estaba
// marcado (idempotente, para no depender de comprobar antes en el cliente).
export async function marcarAsistencia(fecha: string, notas: string | null = null): Promise<CalendarioAsistenciaRow> {
  const db = getDb();
  const cazador_id = await currentUserId();

  const existente = await db.calendarioAsistencias
    .where("cazador_id")
    .equals(cazador_id)
    .filter((a) => a.fecha === fecha)
    .first();
  if (existente) return existente;

  const row: CalendarioAsistenciaRow = {
    id: crypto.randomUUID(),
    cazador_id,
    fecha,
    notas,
    fecha_registro: new Date().toISOString(),
  };

  await db.calendarioAsistencias.put(row);
  await db.outbox.add({
    entity: "calendario_asistencia",
    op: "insert",
    rowId: row.id,
    payload: row,
    createdAt: Date.now(),
  });

  void trySync();
  return row;
}

export async function quitarAsistencia(id: string): Promise<void> {
  const db = getDb();
  await db.calendarioAsistencias.delete(id);
  await db.outbox.add({
    entity: "calendario_asistencia",
    op: "delete",
    rowId: id,
    payload: {},
    createdAt: Date.now(),
  });

  void trySync();
}
