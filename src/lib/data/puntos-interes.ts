import { createClient } from "@/lib/supabase/client";
import { getDb, type PuntoInteresRow } from "@/lib/offline/db";
import { trySync } from "@/lib/sync/sync-manager";
import type { TipoPuntoInteres } from "@/lib/supabase/database.types";

export interface NuevoPuntoInteres {
  nombre: string;
  tipo: TipoPuntoInteres;
  lat: number;
  lng: number;
  notas: string | null;
}

async function currentUserId(): Promise<string> {
  const supabase = createClient();
  // getSession() lee la sesión guardada localmente sin red: funciona sin
  // conexión. getUser() revalida contra el servidor y fallaría offline.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");
  return session.user.id;
}

// Lee de Supabase y refresca la caché local; si falla (sin conexión), sirve
// la última caché conocida.
export async function listPuntosInteres(): Promise<PuntoInteresRow[]> {
  const db = getDb();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("puntos_interes")
    .select("*")
    .order("fecha_creacion", { ascending: true });

  if (!error && data) {
    await db.puntosInteres.bulkPut(data);
    return data;
  }

  return db.puntosInteres.toArray();
}

export async function crearPuntoInteres(
  input: NuevoPuntoInteres
): Promise<PuntoInteresRow> {
  const db = getDb();
  const creado_por = await currentUserId();

  const row: PuntoInteresRow = {
    id: crypto.randomUUID(),
    nombre: input.nombre,
    tipo: input.tipo,
    lat: input.lat,
    lng: input.lng,
    notas: input.notas,
    foto_url: null,
    creado_por,
    fecha_creacion: new Date().toISOString(),
  };

  await db.puntosInteres.put(row);
  await db.outbox.add({
    entity: "punto_interes",
    op: "insert",
    rowId: row.id,
    payload: row,
    createdAt: Date.now(),
  });

  void trySync();
  return row;
}

export async function editarPuntoInteres(
  id: string,
  cambios: Partial<NuevoPuntoInteres>
): Promise<void> {
  const db = getDb();
  const existente = await db.puntosInteres.get(id);
  if (!existente) throw new Error("Punto no encontrado en caché local");

  const actualizado: PuntoInteresRow = { ...existente, ...cambios };
  await db.puntosInteres.put(actualizado);
  await db.outbox.add({
    entity: "punto_interes",
    op: "update",
    rowId: id,
    payload: cambios,
    createdAt: Date.now(),
  });

  void trySync();
}

export async function borrarPuntoInteres(id: string): Promise<void> {
  const db = getDb();
  await db.puntosInteres.delete(id);
  await db.outbox.add({
    entity: "punto_interes",
    op: "delete",
    rowId: id,
    payload: {},
    createdAt: Date.now(),
  });

  void trySync();
}
