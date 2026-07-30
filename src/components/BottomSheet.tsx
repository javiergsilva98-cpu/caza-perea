"use client";

import { useRef } from "react";

// Arrastre hacia abajo de más de esto (en px) cierra la hoja al soltar; por
// debajo, vuelve a su sitio. Coincide con el umbral que usan las hojas
// nativas de iOS.
const CIERRE_UMBRAL_PX = 80;

// Envoltorio compartido de las hojas inferiores (formularios, detalles,
// paneles) que se repetía casi idéntico en una docena de componentes.
// Deliberadamente no incluye el título ni el contenido — cada sitio sigue
// escribiendo su propia cabecera y campos, solo se centraliza el fondo, la
// hoja redondeada, el tirador y el cierre al tocar fuera o arrastrar el
// tirador hacia abajo.
export function BottomSheet({
  onBackdropClick,
  scrollable,
  showHandle = true,
  children,
}: {
  onBackdropClick?: () => void;
  scrollable?: boolean;
  showHandle?: boolean;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef(0);
  const draggingRef = useRef(false);

  // Manipula el transform directamente sobre el DOM en vez de por estado de
  // React — con un re-render por cada pointermove el arrastre se nota a
  // tirones en un móvil de gama media.
  function handlePointerDown(e: React.PointerEvent) {
    if (!onBackdropClick || !sheetRef.current) return;
    draggingRef.current = true;
    startYRef.current = e.clientY;
    sheetRef.current.style.transition = "none";
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current || !sheetRef.current) return;
    const delta = Math.max(0, e.clientY - startYRef.current);
    sheetRef.current.style.transform = `translateY(${delta}px)`;
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!draggingRef.current || !sheetRef.current) return;
    draggingRef.current = false;
    const delta = Math.max(0, e.clientY - startYRef.current);
    sheetRef.current.style.transition = "";
    sheetRef.current.style.transform = "";
    if (delta > CIERRE_UMBRAL_PX) onBackdropClick?.();
  }

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40"
      onClick={onBackdropClick}
    >
      <div
        ref={sheetRef}
        className={`rounded-t-2xl bg-bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] ${
          scrollable ? "max-h-[85vh] overflow-y-auto" : ""
        }`}
        onClick={onBackdropClick ? (e) => e.stopPropagation() : undefined}
      >
        {showHandle && (
          <div
            className="-mx-4 -mt-4 mb-3 flex touch-none justify-center px-4 pb-3 pt-4"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="h-1 w-10 rounded-full bg-ink-soft/30" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
