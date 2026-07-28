"use client";

import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();
  if (pathname !== "/perfil") return null;

  return (
    <header className="border-b border-border bg-bg-card px-4 py-3">
      <p className="text-sm font-semibold text-ink">Casa Perea</p>
      <p className="text-xs text-ink-soft">Coto CU10053</p>
    </header>
  );
}
