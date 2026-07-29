"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const HERRAMIENTAS = [
  { href: "/capturas", label: "Capturas", icon: "🎯" },
  { href: "/actividades", label: "Actividad", icon: "🧰" },
  { href: "/esperas", label: "Esperas", icon: "🪑" },
  { href: "/calendario", label: "Calendario", icon: "📅" },
  { href: "/gastos", label: "Gastos", icon: "💶" },
  { href: "/estadisticas", label: "Estadísticas", icon: "📊" },
  { href: "/perfil", label: "Perfil", icon: "👤" },
] as const;

const BOTTOM_SAFE = "bottom-[calc(1rem+env(safe-area-inset-bottom))]";

export function AppNav() {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  if (pathname !== "/mapa") {
    return (
      <Link
        href="/mapa"
        aria-label="Volver al mapa"
        title="Volver al mapa"
        className={`fixed ${BOTTOM_SAFE} left-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl leading-none text-white shadow-lg`}
      >
        🗺️
      </Link>
    );
  }

  return (
    <div className={`fixed ${BOTTOM_SAFE} left-4 z-20 flex flex-col items-start gap-2`}>
      {abierto &&
        HERRAMIENTAS.map((h) => (
          <Link
            key={h.href}
            href={h.href}
            onClick={() => setAbierto(false)}
            className="flex items-center gap-2 rounded-full border border-border bg-bg-card py-2 pl-3 pr-4 text-sm font-medium text-ink shadow"
          >
            <span className="text-xl leading-none">{h.icon}</span>
            {h.label}
          </Link>
        ))}
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
