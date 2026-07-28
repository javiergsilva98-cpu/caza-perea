"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // El service worker llama a skipWaiting()/clients.claim() en cuanto se
    // instala una versión nueva, así que toma el control enseguida — pero
    // una pestaña que ya estaba abierta se queda con el HTML/JS antiguo en
    // memoria hasta que se recarga. Recargamos una vez cuando eso pasa para
    // no depender de que el usuario cierre la app a mano tras cada despliegue.
    let recargando = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (recargando) return;
      recargando = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((error) => console.error("Error registrando el service worker", error));
  }, []);

  return null;
}
