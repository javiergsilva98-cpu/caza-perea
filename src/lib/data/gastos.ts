import { createClient } from "@/lib/supabase/client";
import { getDb, type GastoRow } from "@/lib/offline/db";
import { trySync } from "@/lib/sync/sync-manager";

export interface NuevoGasto {
  concepto: string;
  importe: number;
  pagado_por: string;
  fecha: string; // YYYY-MM-DD
  notas: string | null;
  proveedor: string | null;
}

async function currentUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");
  return session.user.id;
}

export async function listGastos(): Promise<GastoRow[]> {
  const db = getDb();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("gastos")
    .select("*")
    .order("fecha", { ascending: false })
    .order("fecha_registro", { ascending: false });

  if (!error && data) {
    await db.gastos.bulkPut(data);
    return data;
  }

  const cached = await db.gastos.toArray();
  return cached.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export async function crearGasto(input: NuevoGasto): Promise<GastoRow> {
  const db = getDb();
  const registrado_por = await currentUserId();

  const row: GastoRow = {
    id: crypto.randomUUID(),
    concepto: input.concepto,
    importe: input.importe,
    pagado_por: input.pagado_por,
    fecha: input.fecha,
    notas: input.notas,
    proveedor: input.proveedor,
    registrado_por,
    fecha_registro: new Date().toISOString(),
  };

  await db.gastos.put(row);
  await db.outbox.add({
    entity: "gasto",
    op: "insert",
    rowId: row.id,
    payload: row,
    createdAt: Date.now(),
  });

  void trySync();
  return row;
}

export async function borrarGasto(id: string): Promise<void> {
  const db = getDb();
  await db.gastos.delete(id);
  await db.outbox.add({
    entity: "gasto",
    op: "delete",
    rowId: id,
    payload: {},
    createdAt: Date.now(),
  });

  void trySync();
}
