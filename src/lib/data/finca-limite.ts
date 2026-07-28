import { createClient } from "@/lib/supabase/client";
import { getDb, type FincaLimiteRow } from "@/lib/offline/db";
import { trySync } from "@/lib/sync/sync-manager";
import type { Json } from "@/lib/supabase/database.types";

async function currentUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");
  return session.user.id;
}

export async function getFincaLimiteActual(): Promise<FincaLimiteRow | null> {
  const db = getDb();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("finca_limite_actual")
    .select("*")
    .maybeSingle();

  if (!error && data) {
    await db.fincaLimiteActual.clear();
    await db.fincaLimiteActual.put(data);
    return data;
  }

  const cached = await db.fincaLimiteActual.toCollection().first();
  return cached ?? null;
}

export async function guardarFincaLimite(geometria: Json): Promise<FincaLimiteRow> {
  const db = getDb();
  const actualizado_por = await currentUserId();
  const anterior = await db.fincaLimiteActual.toCollection().first();

  const row: FincaLimiteRow = {
    id: crypto.randomUUID(),
    // Versión tentativa solo para mostrarla ya en pantalla; el servidor
    // asigna la versión real al sincronizar (trigger finca_limite_set_version).
    version: (anterior?.version ?? 0) + 1,
    geometria,
    actualizado_por,
    fecha_actualizacion: new Date().toISOString(),
  };

  await db.fincaLimiteActual.clear();
  await db.fincaLimiteActual.put(row);
  await db.outbox.add({
    entity: "finca_limite",
    op: "insert",
    rowId: row.id,
    payload: { id: row.id, geometria, actualizado_por },
    createdAt: Date.now(),
  });

  void trySync();
  return row;
}
