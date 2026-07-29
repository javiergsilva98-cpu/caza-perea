import { createClient } from "@/lib/supabase/client";
import { getDb, type CapturaRow } from "@/lib/offline/db";
import { trySync } from "@/lib/sync/sync-manager";
import type { TipoCaptura } from "@/lib/supabase/database.types";

export interface NuevaCaptura {
  tipo: TipoCaptura;
  especie: string;
  cantidad: number;
  fecha: string; // YYYY-MM-DD
  notas: string | null;
  lat: number | null;
  lng: number | null;
  foto_url?: string | null;
}

async function currentUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");
  return session.user.id;
}

export async function listCapturas(): Promise<CapturaRow[]> {
  const db = getDb();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("capturas_avistamientos")
    .select("*")
    .order("fecha", { ascending: false })
    .order("fecha_registro", { ascending: false });

  if (!error && data) {
    await db.capturas.bulkPut(data);
    return data;
  }

  const cached = await db.capturas.toArray();
  return cached.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export async function crearCaptura(input: NuevaCaptura): Promise<CapturaRow> {
  const db = getDb();
  const registrado_por = await currentUserId();

  const row: CapturaRow = {
    id: crypto.randomUUID(),
    tipo: input.tipo,
    especie: input.especie,
    cantidad: input.cantidad,
    lat: input.lat,
    lng: input.lng,
    punto_interes_id: null,
    notas: input.notas,
    foto_url: input.foto_url ?? null,
    registrado_por,
    fecha: input.fecha,
    fecha_registro: new Date().toISOString(),
  };

  await db.capturas.put(row);
  await db.outbox.add({
    entity: "captura_avistamiento",
    op: "insert",
    rowId: row.id,
    payload: row,
    createdAt: Date.now(),
  });

  void trySync();
  return row;
}

export async function borrarCaptura(id: string): Promise<void> {
  const db = getDb();
  await db.capturas.delete(id);
  await db.outbox.add({
    entity: "captura_avistamiento",
    op: "delete",
    rowId: id,
    payload: {},
    createdAt: Date.now(),
  });

  void trySync();
}
