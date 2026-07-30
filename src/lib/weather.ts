import { FINCA_CENTER } from "@/lib/constants";

export interface TiempoDia {
  fecha: string;
  codigo: number;
  max: number;
  min: number;
  probPrecipitacion: number;
}

export interface Tiempo {
  temperaturaActual: number;
  codigoActual: number;
  vientoActual: number;
  dias: TiempoDia[];
}

// Open-Meteo: API pública, gratuita, sin necesidad de clave. Códigos de
// tiempo estándar WMO (https://open-meteo.com/en/docs).
export async function obtenerTiempo(): Promise<Tiempo | null> {
  const [lat, lng] = FINCA_CENTER;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=auto&forecast_days=5`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const dias: TiempoDia[] = data.daily.time.map((fecha: string, i: number) => ({
      fecha,
      codigo: data.daily.weather_code[i],
      max: Math.round(data.daily.temperature_2m_max[i]),
      min: Math.round(data.daily.temperature_2m_min[i]),
      probPrecipitacion: data.daily.precipitation_probability_max[i],
    }));

    return {
      temperaturaActual: Math.round(data.current.temperature_2m),
      codigoActual: data.current.weather_code,
      vientoActual: Math.round(data.current.wind_speed_10m),
      dias,
    };
  } catch {
    return null;
  }
}

const ICONO_POR_CODIGO: [number[], string][] = [
  [[0], "☀️"],
  [[1], "🌤️"],
  [[2], "⛅"],
  [[3], "☁️"],
  [[45, 48], "🌫️"],
  [[51, 53, 55, 56, 57], "🌦️"],
  [[61, 63, 65, 66, 67], "🌧️"],
  [[71, 73, 75, 77, 85, 86], "🌨️"],
  [[80, 81, 82], "🌦️"],
  [[95, 96, 99], "⛈️"],
];

export function iconoTiempo(codigo: number): string {
  return ICONO_POR_CODIGO.find(([codigos]) => codigos.includes(codigo))?.[1] ?? "🌡️";
}

const PUNTOS_CARDINALES = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];

export function direccionCardinal(grados: number): string {
  return PUNTOS_CARDINALES[Math.round(grados / 45) % 8];
}

// --- Apartado "Tiempo" (página propia): todos los indicadores que da
// Open-Meteo, para tener de dónde filtrar más adelante lo que de verdad
// interesa. Se deja aparte de obtenerTiempo() (que sigue usando el widget
// del mapa) para no tocar ese camino ya verificado.

export interface TiempoActualCompleto {
  temperatura: number;
  sensacionTermica: number;
  humedad: number;
  codigo: number;
  esDeDia: boolean;
  precipitacion: number;
  nubosidad: number;
  presion: number;
  vientoVelocidad: number;
  vientoDireccion: number;
  vientoRafagas: number;
  uvIndex: number | null;
}

export interface TiempoHora {
  hora: string;
  temperatura: number;
  probPrecipitacion: number;
  vientoVelocidad: number;
  uvIndex: number;
}

export interface TiempoDiaCompleto {
  fecha: string;
  codigo: number;
  max: number;
  min: number;
  sensacionMax: number;
  sensacionMin: number;
  probPrecipitacion: number;
  precipitacionMm: number;
  horasPrecipitacion: number;
  vientoMax: number;
  rafagasMax: number;
  direccionDominante: number;
  amanecer: string;
  atardecer: string;
  horasSol: number;
  uvMax: number;
}

export interface TiempoCompleto {
  actual: TiempoActualCompleto;
  // Próximas 24h a partir de ahora (no desde medianoche).
  horas: TiempoHora[];
  dias: TiempoDiaCompleto[];
}

export async function obtenerTiempoCompleto(): Promise<TiempoCompleto | null> {
  const [lat, lng] = FINCA_CENTER;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
    `&hourly=temperature_2m,precipitation_probability,wind_speed_10m,uv_index` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_sum,precipitation_probability_max,precipitation_hours,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant` +
    `&timezone=auto&forecast_days=7`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const horasCompletas: TiempoHora[] = data.hourly.time.map((hora: string, i: number) => ({
      hora,
      temperatura: Math.round(data.hourly.temperature_2m[i]),
      probPrecipitacion: data.hourly.precipitation_probability[i],
      vientoVelocidad: Math.round(data.hourly.wind_speed_10m[i]),
      uvIndex: data.hourly.uv_index[i],
    }));

    // El índice UV horario no viene en el bloque "current" — se toma del
    // tramo horario en el que cae la hora actual.
    const ahora = Date.now();
    let idxSiguiente = horasCompletas.findIndex((h) => new Date(h.hora).getTime() > ahora);
    if (idxSiguiente === -1) idxSiguiente = horasCompletas.length;
    const idxActual = Math.max(0, idxSiguiente - 1);

    const actual: TiempoActualCompleto = {
      temperatura: Math.round(data.current.temperature_2m),
      sensacionTermica: Math.round(data.current.apparent_temperature),
      humedad: data.current.relative_humidity_2m,
      codigo: data.current.weather_code,
      esDeDia: data.current.is_day === 1,
      precipitacion: data.current.precipitation,
      nubosidad: data.current.cloud_cover,
      presion: Math.round(data.current.pressure_msl),
      vientoVelocidad: Math.round(data.current.wind_speed_10m),
      vientoDireccion: data.current.wind_direction_10m,
      vientoRafagas: Math.round(data.current.wind_gusts_10m),
      uvIndex: horasCompletas[idxActual]?.uvIndex ?? null,
    };

    const dias: TiempoDiaCompleto[] = data.daily.time.map((fecha: string, i: number) => ({
      fecha,
      codigo: data.daily.weather_code[i],
      max: Math.round(data.daily.temperature_2m_max[i]),
      min: Math.round(data.daily.temperature_2m_min[i]),
      sensacionMax: Math.round(data.daily.apparent_temperature_max[i]),
      sensacionMin: Math.round(data.daily.apparent_temperature_min[i]),
      probPrecipitacion: data.daily.precipitation_probability_max[i],
      precipitacionMm: data.daily.precipitation_sum[i],
      horasPrecipitacion: data.daily.precipitation_hours[i],
      vientoMax: Math.round(data.daily.wind_speed_10m_max[i]),
      rafagasMax: Math.round(data.daily.wind_gusts_10m_max[i]),
      direccionDominante: data.daily.wind_direction_10m_dominant[i],
      amanecer: data.daily.sunrise[i],
      atardecer: data.daily.sunset[i],
      horasSol: Math.round((data.daily.daylight_duration[i] / 3600) * 10) / 10,
      uvMax: data.daily.uv_index_max[i],
    }));

    return { actual, horas: horasCompletas.slice(idxSiguiente, idxSiguiente + 24), dias };
  } catch {
    return null;
  }
}
