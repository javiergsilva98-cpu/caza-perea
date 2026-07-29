-- Campo opcional de proveedor en gastos, para poder comparar precios entre
-- proveedores (p.ej. de grano) a lo largo del tiempo.

alter table public.gastos add column proveedor text;
