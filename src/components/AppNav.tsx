"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useMapTools } from "@/lib/map-tools-context";

const HERRAMIENTAS = [
  { href: "/mapa", label: "Mapa", icon: "🗺️" },
  { href: "/capturas", label: "Capturas", icon: "🎯" },
  { href: "/actividades", label: "Actividad", icon: "🧰" },
  { href: "/esperas", label: "Esperas", icon: "🪑" },
  { href: "/calendario", label: "Calendario", icon: "📅" },
  { href: "/gastos", label: "Gastos", icon: "💶" },
  { href: "/lista", label: "Maleta", icon: "🎒" },
  { href: "/tiempo", label: "Tiempo", icon: "🌤️" },
] as const;

const BOTTOM_SAFE = "bottom-[calc(1rem+env(safe-area-inset-bottom))]";
const ITEM_CLASS =
  "flex items-center gap-2 rounded-full border border-border bg-bg-card py-2 pl-3 pr-4 text-sm font-medium text-ink shadow";

export function AppNav() {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const { tools } = useMapTools();

  // El menú se queda abierto mientras la edición de la linde está activa,
  // para poder volver a tocar "Cancelar"/"Guardar linde" sin reabrirlo.
  const mostrar = abierto || !!tools.editarLindeActivo;

  return (
    <div className={`fixed ${BOTTOM_SAFE} left-4 z-20 flex flex-col items-start gap-2`}>
      {mostrar && (
        <>
          {HERRAMIENTAS.filter((h) => h.href !== pathname).map((h) => (
            <Link key={h.href} href={h.href} onClick={() => setAbierto(false)} className={ITEM_CLASS}>
              <span className="text-xl leading-none">{h.icon}</span>
              {h.label}
            </Link>
          ))}
          {tools.descargarZona && (
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                tools.descargarZona!();
              }}
              className={ITEM_CLASS}
            >
              <span className="text-xl leading-none">⬇️</span>
              Descargar zona
            </button>
          )}
          {tools.editarLinde && (
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                tools.editarLinde!();
              }}
              className={`${ITEM_CLASS} ${tools.editarLindeActivo ? "border-alert bg-alert text-white" : ""}`}
            >
              <span className="text-xl leading-none">{tools.editarLindeIcono ?? "✏️"}</span>
              {tools.editarLindeLabel ?? "Editar linde"}
            </button>
          )}
          {pathname !== "/perfil" && (
            <Link href="/perfil" onClick={() => setAbierto(false)} className={ITEM_CLASS}>
              <span className="text-xl leading-none">👤</span>
              Perfil
            </Link>
          )}
        </>
      )}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? "Cerrar herramientas" : "Abrir herramientas"}
        title="Herramientas"
        className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-bg-card text-2xl leading-none text-ink shadow-lg"
      >
        {abierto ? "×" : "☰"}
      </button>
    </div>
  );
}
