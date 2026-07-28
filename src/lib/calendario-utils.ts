// Utilidades de fechas para el calendario. Ojo: no usar
// `Date.prototype.toISOString()` aquí — convierte a UTC, y para un día
// concreto construido en hora local (p.ej. `new Date(2026, 7, 5)`) eso
// puede desplazar la fecha un día hacia atrás en husos horarios positivos
// como el de España.
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface DiaCalendario {
  fecha: string;
  numero: number;
  esHoy: boolean;
}

// Semana de lunes a domingo. Devuelve una rejilla de semanas completas
// (con huecos `null` antes del día 1 y después del último día del mes).
export function construirMes(anio: number, mes: number): (DiaCalendario | null)[][] {
  const hoy = toISODate(new Date());
  const primerDia = new Date(anio, mes, 1);
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const offset = (primerDia.getDay() + 6) % 7; // lunes = 0

  const dias: (DiaCalendario | null)[] = Array.from({ length: offset }, () => null);
  for (let n = 1; n <= totalDias; n++) {
    const fecha = toISODate(new Date(anio, mes, n));
    dias.push({ fecha, numero: n, esHoy: fecha === hoy });
  }
  while (dias.length % 7 !== 0) dias.push(null);

  const semanas: (DiaCalendario | null)[][] = [];
  for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));
  return semanas;
}

export const NOMBRE_MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const DIA_SEMANA_CORTO = ["L", "M", "X", "J", "V", "S", "D"];
