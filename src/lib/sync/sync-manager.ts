import { getDb, type OutboxEntry } from "@/lib/offline/db";
import { createClient } from "@/lib/supabase/client";

type Listener = () => void;

const listeners = new Set<Listener>();
let syncing = false;

export function onSyncStateChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

export async function pendingCount(): Promise<number> {
  return getDb().outbox.count();
}

// Los errores de red (sin conexión) llegan como TypeError ("Failed to
// fetch") y no traen `code` de Postgres/PostgREST: hay que reintentarlos
// más tarde. Un error con `code` es una respuesta real del servidor
// (permiso denegado, validación, etc.) y no tiene sentido reintentarlo solo.
function isNetworkError(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "code" in error) {
    return !(error as { code?: string }).code;
  }
  return error instanceof TypeError;
}

const TABLE_BY_ENTITY = {
  punto_interes: "puntos_interes",
  finca_limite: "finca_limite",
  captura_avistamiento: "capturas_avistamientos",
  actividad: "actividades",
  espera: "esperas",
  calendario_asistencia: "calendario_asistencias",
  gasto: "gastos",
} as const;

// finca_limite es de solo-inserción: cada edición crea una versión nueva
// (nunca update/delete a través del outbox).
async function applyEntry(
  supabase: ReturnType<typeof createClient>,
  entry: OutboxEntry
) {
  const table = TABLE_BY_ENTITY[entry.entity];

  if (entry.op === "insert") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(table).insert(entry.payload as any);
    if (error) throw error;
    return;
  }
  if (entry.op === "update") {
    const { error } = await supabase
      .from(table)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(entry.payload as any)
      .eq("id", entry.rowId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from(table).delete().eq("id", entry.rowId);
  if (error) throw error;
}

export async function trySync(): Promise<void> {
  if (syncing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  syncing = true;
  try {
    const db = getDb();
    const supabase = createClient();
    const entries = await db.outbox.orderBy("createdAt").toArray();

    for (const entry of entries) {
      try {
        await applyEntry(supabase, entry);
        await db.outbox.delete(entry.id!);
      } catch (error) {
        if (isNetworkError(error)) {
          // Sin conexión de verdad: paramos aquí y reintentamos más tarde,
          // respetando el orden de la cola.
          break;
        }
        await db.syncErrors.add({
          entity: entry.entity,
          op: entry.op,
          rowId: entry.rowId,
          message: error instanceof Error ? error.message : String(error),
          occurredAt: Date.now(),
        });
        await db.outbox.delete(entry.id!);
      }
    }
  } finally {
    syncing = false;
    notify();
  }
}

let started = false;

// Arranca los disparadores de sincronización (llamar una vez desde el
// cliente, p.ej. en el layout autenticado). Sincroniza al recuperar
// conexión, al volver la pestaña a primer plano, y cada 30s como red de
// seguridad — sin depender de la Background Sync API (no soportada en
// iOS Safari, el navegador que más nos importa aquí).
export function startSyncTriggers() {
  if (started || typeof window === "undefined") return;
  started = true;

  window.addEventListener("online", () => void trySync());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void trySync();
  });
  window.setInterval(() => void trySync(), 30_000);
  void trySync();
}
