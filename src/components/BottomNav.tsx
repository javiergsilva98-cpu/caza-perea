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
      className="sticky bottom-0 z-10 flex items-end border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-white/10 dark:bg-black/95"
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
              active ? "text-emerald-800 dark:text-emerald-400" : "text-foreground/50"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <span
              className={
                esMapa
                  ? `-mt-4 flex h-12 w-12 items-center justify-center rounded-full text-2xl leading-none shadow ${
                      active
                        ? "bg-emerald-800 text-white"
                        : "bg-emerald-800/90 text-white"
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
