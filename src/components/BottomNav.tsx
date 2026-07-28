"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/capturas", label: "Capturas", icon: "🎯" },
  { href: "/actividades", label: "Actividad", icon: "🧰" },
  { href: "/mapa", label: "Mapa", icon: "🗺️" },
  { href: "/esperas", label: "Esperas", icon: "🪑" },
  { href: "/perfil", label: "Perfil", icon: "👤" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-10 flex items-end border-t border-border bg-bg-card pb-[env(safe-area-inset-bottom)] backdrop-blur"
      aria-label="Navegación principal"
    >
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const esMapa = item.href === "/mapa";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
              active ? "text-primary" : "text-ink-soft"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <span
              className={
                esMapa
                  ? `-mt-4 flex h-12 w-12 items-center justify-center rounded-full text-2xl leading-none shadow ${
                      active ? "bg-primary text-white" : "bg-primary/90 text-white"
                    }`
                  : "text-lg leading-none"
              }
              aria-hidden="true"
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
