export const ESPECIES = [
  "Conejo",
  "Perdiz",
  "Paloma",
  "Zorro",
  "Jabalí",
  "Corzo",
  "Codorniz",
  "Liebre",
  "Zorzal",
];

const ICONO_POR_ESPECIE: Record<string, string> = {
  Conejo: "🐇",
  Perdiz: "🐦",
  Paloma: "🕊️",
  Zorro: "🦊",
  Jabalí: "🐗",
  Corzo: "🦌",
  Codorniz: "🐦",
  Liebre: "🐇",
  Zorzal: "🐦",
};

export function iconoEspecie(especie: string): string {
  return ICONO_POR_ESPECIE[especie] ?? "🐾";
}
