import Dexie, { type Table } from "dexie";
import type { Database } from "@/lib/supabase/database.types";

export type PuntoInteresRow = Database["public"]["Tables"]["puntos_interes"]["Row"];
export type FincaLimiteRow = Database["public"]["Tables"]["finca_limite"]["Row"];
export type CapturaRow = Database["public"]["Tables"]["capturas_avistamientos"]["Row"];
export type ActividadRow = Database["public"]["Tables"]["actividades"]["Row"];

export type OutboxEntity =
  | "punto_interes"
  | "finca_limite"
  | "captura_avistamiento"
  | "actividad";
export type OutboxOp = "insert" | "update" | "delete";

export interface OutboxEntry {
  id?: number;
  entity: OutboxEntity;
  op: OutboxOp;
  rowId: string;
  payload: Record<string, unknown>;
  createdAt: number;
}

export interface SyncErrorEntry {
  id?: number;
  entity: OutboxEntity;
  op: OutboxOp;
  rowId: string;
  message: string;
  occurredAt: number;
}

class CasaPereaDB extends Dexie {
  puntosInteres!: Table<PuntoInteresRow, string>;
  fincaLimiteActual!: Table<FincaLimiteRow, string>;
  capturas!: Table<CapturaRow, string>;
  actividades!: Table<ActividadRow, string>;
  outbox!: Table<OutboxEntry, number>;
  syncErrors!: Table<SyncErrorEntry, number>;

  constructor() {
    super("casa-perea");
    this.version(1).stores({
      puntosInteres: "id",
      // Cache de la última versión sincronizada de la linde, clave fija "actual".
      fincaLimiteActual: "id",
      outbox: "++id, entity, rowId, createdAt",
      syncErrors: "++id, entity, rowId, occurredAt",
    });
    // v2 (Sprint 2): capturas/avistamientos y actividades. Los stores de la
    // v1 se mantienen automáticamente, solo se añaden los nuevos.
    this.version(2).stores({
      capturas: "id, fecha",
      actividades: "id, punto_interes_id, fecha",
    });
  }
}

let instance: CasaPereaDB | null = null;

// Dexie necesita IndexedDB, que no existe en el servidor. Se instancia de
// forma perezosa y solo debe llamarse desde código que se ejecute en el
// cliente (efectos, manejadores de eventos), nunca durante el render inicial.
export function getDb(): CasaPereaDB {
  if (typeof window === "undefined") {
    throw new Error("getDb() solo puede usarse en el cliente");
  }
  if (!instance) {
    instance = new CasaPereaDB();
  }
  return instance;
}
