import L from "leaflet";
import type { TipoCaptura, TipoPuntoInteres } from "@/lib/supabase/database.types";

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

const EMOJI_CAPTURA: Record<TipoCaptura, string> = {
  captura: "🐗",
  avistamiento: "👁",
};

function divIconEmoji(emoji: string): L.DivIcon {
  return L.divIcon({
    html: `<span style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))">${emoji}</span>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function iconoPunto(tipo: TipoPuntoInteres): L.DivIcon {
  return divIconEmoji(EMOJI[tipo] ?? EMOJI.otro);
}

export function iconoCaptura(tipo: TipoCaptura): L.DivIcon {
  return divIconEmoji(EMOJI_CAPTURA[tipo] ?? EMOJI_CAPTURA.avistamiento);
}
