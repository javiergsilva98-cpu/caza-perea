import { createClient } from "@/lib/supabase/client";
import { getDb, type ActividadRow } from "@/lib/offline/db";
import { trySync } from "@/lib/sync/sync-manager";
import type { TipoActividad } from "@/lib/supabase/database.types";

export interface NuevaActividad {
  punto_interes_id: string;
  tipo: TipoActividad;
  fecha: string; // YYYY-MM-DD
  proxima_fecha_estimada: string | null;
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

export async function listActividades(): Promise<ActividadRow[]> {
  const db = getDb();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("actividades")
    .select("*")
    .order("fecha", { ascending: false })
    .order("fecha_registro", { ascending: false });

  if (!error && data) {
    await db.actividades.bulkPut(data);
    return data;
  }

  const cached = await db.actividades.toArray();
  return cached.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export async function crearActividad(input: NuevaActividad): Promise<ActividadRow> {
  const db = getDb();
  const realizado_por = await currentUserId();

  const row: ActividadRow = {
    id: crypto.randomUUID(),
    punto_interes_id: input.punto_interes_id,
    tipo: input.tipo,
    notas: input.notas,
    realizado_por,
    fecha: input.fecha,
    proxima_fecha_estimada: input.proxima_fecha_estimada,
    fecha_registro: new Date().toISOString(),
  };

  await db.actividades.put(row);
  await db.outbox.add({
    entity: "actividad",
    op: "insert",
    rowId: row.id,
    payload: row,
    createdAt: Date.now(),
  });

  void trySync();
  return row;
}

export async function borrarActividad(id: string): Promise<void> {
  const db = getDb();
  await db.actividades.delete(id);
  await db.outbox.add({
    entity: "actividad",
    op: "delete",
    rowId: id,
    payload: {},
    createdAt: Date.now(),
  });

  void trySync();
}
