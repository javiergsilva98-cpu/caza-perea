"use client";

import { useEffect, useState } from "react";
import { onSyncStateChange, pendingCount, trySync } from "@/lib/sync/sync-manager";

export function SyncBadge() {
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine
  );

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    const refresh = () => void pendingCount().then(setPending);
    refresh();
    const unsubscribe = onSyncStateChange(refresh);
    const interval = window.setInterval(refresh, 5_000);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  if (online && pending === 0) return null;

  return (
    <button
      type="button"
      onClick={() => void trySync()}
      className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-border bg-bg-card px-3 py-1.5 text-xs font-medium text-ink shadow"
    >
      <span
        className={`h-2 w-2 rounded-full ${online ? "bg-marker" : "bg-alert"}`}
        aria-hidden="true"
      />
      {online
        ? `Sincronizando ${pending} pendiente${pending === 1 ? "" : "s"}…`
        : "Sin conexión — se guardará al recuperar señal"}
    </button>
  );
}
