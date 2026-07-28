-- Nueva categoría de punto de interés: "casa" (la vivienda/refugio de la
-- finca), junto a comedero/bebedero/puesto/otro.

alter table public.puntos_interes drop constraint puntos_interes_tipo_check;

alter table public.puntos_interes
  add constraint puntos_interes_tipo_check
  check (tipo in ('comedero', 'bebedero', 'puesto', 'casa', 'otro'));
