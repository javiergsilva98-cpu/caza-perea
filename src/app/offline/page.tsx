export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold text-foreground">Sin conexión</h1>
      <p className="max-w-xs text-sm text-foreground/70">
        No hay cobertura en este momento. Vuelve a intentarlo cuando
        recuperes señal — tus datos se sincronizarán automáticamente.
      </p>
    </div>
  );
}
