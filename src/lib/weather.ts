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
