"use client";

import dynamic from "next/dynamic";

// Leaflet toca `window` al importarse: debe cargarse solo en el cliente,
// nunca durante el renderizado en el servidor.
const FincaMap = dynamic(
  () => import("@/components/map/FincaMap").then((mod) => mod.FincaMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center text-sm text-foreground/50">
        Cargando mapa…
      </div>
    ),
  }
);

export default function MapaPage() {
  return <FincaMap />;
}
