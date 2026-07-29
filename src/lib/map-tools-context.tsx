"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Puente entre el AppNav (menú de herramientas, fuera del árbol del mapa) y
// FincaMap (dentro de la página): "Editar linde" y "Descargar zona" viven en
// la lista de herramientas, pero son acciones que solo tienen sentido con el
// mapa montado — FincaMap registra aquí sus manejadores al montarse.
export interface MapTools {
  editarLinde?: () => void;
  editarLindeLabel?: string;
  editarLindeIcono?: string;
  editarLindeActivo?: boolean;
  descargarZona?: () => void;
}

interface MapToolsContextValue {
  tools: MapTools;
  setTools: (tools: MapTools) => void;
}

const MapToolsContext = createContext<MapToolsContextValue | null>(null);

export function MapToolsProvider({ children }: { children: ReactNode }) {
  const [tools, setTools] = useState<MapTools>({});
  return (
    <MapToolsContext.Provider value={{ tools, setTools }}>{children}</MapToolsContext.Provider>
  );
}

export function useMapTools(): MapToolsContextValue {
  const ctx = useContext(MapToolsContext);
  if (!ctx) throw new Error("useMapTools debe usarse dentro de MapToolsProvider");
  return ctx;
}
