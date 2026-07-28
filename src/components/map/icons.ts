import L from "leaflet";
import type { TipoPuntoInteres } from "@/lib/supabase/database.types";

const EMOJI: Record<TipoPuntoInteres, string> = {
  comedero: "🌾",
  bebedero: "💧",
  puesto: "🎯",
  otro: "📍",
};

export const TIPO_LABEL: Record<TipoPuntoInteres, string> = {
  comedero: "Comedero",
  bebedero: "Bebedero",
  puesto: "Puesto",
  otro: "Otro",
};

export function iconoPunto(tipo: TipoPuntoInteres): L.DivIcon {
  return L.divIcon({
    html: `<span style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))">${EMOJI[tipo] ?? EMOJI.otro}</span>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}
