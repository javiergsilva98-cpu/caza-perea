// Para columnas `date` (YYYY-MM-DD, sin hora): sumar "T00:00:00" fuerza a
// interpretarla en la zona horaria local en vez de UTC medianoche, para que
// no se desplace un día en zonas con offset negativo.
export function formatFecha(
  fechaISO: string,
  opciones: { weekday?: boolean; year?: boolean } = {}
): string {
  return new Date(fechaISO + "T00:00:00").toLocaleDateString("es-ES", {
    ...(opciones.weekday ? { weekday: "short" as const } : {}),
    day: "2-digit",
    month: "short",
    ...(opciones.year ? { year: "numeric" as const } : {}),
  });
}

// Para columnas `timestamptz` (ya traen hora y zona): se parsean tal cual.
export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Fecha de hoy en YYYY-MM-DD, para precargar campos de fecha. Ojo: no usar
// `Date.prototype.toISOString()` — convierte a UTC, así que entre
// medianoche y la 1-2 de la madrugada (huso de España) devolvería el día
// de ayer.
export function hoyISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
