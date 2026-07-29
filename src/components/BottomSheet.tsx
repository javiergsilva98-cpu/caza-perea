"use client";

// Envoltorio compartido de las hojas inferiores (formularios, detalles,
// paneles) que se repetía casi idéntico en una docena de componentes.
// Deliberadamente no incluye el título ni el contenido — cada sitio sigue
// escribiendo su propia cabecera y campos, solo se centraliza el fondo, la
// hoja redondeada, el tirador y el cierre al tocar fuera.
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
  return (
    <div
      className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40"
      onClick={onBackdropClick}
    >
      <div
        className={`rounded-t-2xl bg-bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] ${
          scrollable ? "max-h-[85vh] overflow-y-auto" : ""
        }`}
        onClick={onBackdropClick ? (e) => e.stopPropagation() : undefined}
      >
        {showHandle && <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-soft/30" />}
        {children}
      </div>
    </div>
  );
}
