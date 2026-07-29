import { useMemo, useState } from "react";

// Pagina en el cliente una lista ya cargada en memoria (todo sigue
// descargándose y cacheándose entero para el uso offline — esto solo evita
// pintar de golpe cientos de filas en el DOM cuando el histórico crece).
export function usePaginado<T>(items: T[], tamanoPagina = 30) {
  const [visiblesCount, setVisiblesCount] = useState(tamanoPagina);

  const visibles = useMemo(() => items.slice(0, visiblesCount), [items, visiblesCount]);
  const hayMas = items.length > visiblesCount;

  function mostrarMas() {
    setVisiblesCount((n) => n + tamanoPagina);
  }

  return { visibles, hayMas, mostrarMas };
}
