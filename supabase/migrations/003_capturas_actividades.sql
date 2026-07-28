-- Sprint 2: capturas/avistamientos y actividades (mantenimiento de puntos
-- de interés). Mismo patrón de RLS que puntos_interes: lectura abierta a
-- cualquier autenticado, escritura propia o admin.

-- ---------------------------------------------------------------------
-- capturas_avistamientos
-- ---------------------------------------------------------------------
create table public.capturas_avistamientos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('captura', 'avistamiento')),
  especie text not null,
  cantidad integer not null default 1 check (cantidad > 0),
  lat double precision,
  lng double precision,
  punto_interes_id uuid references public.puntos_interes (id) on delete set null,
  notas text,
  foto_url text,
  registrado_por uuid not null references public.usuarios (id) default auth.uid(),
  fecha date not null default current_date,
  fecha_registro timestamptz not null default now()
);

comment on table public.capturas_avistamientos is 'Registro de capturas y avistamientos durante esperas/monterías.';

alter table public.capturas_avistamientos enable row level security;

create policy "capturas_select_authenticated"
  on public.capturas_avistamientos for select
  to authenticated
  using (true);

create policy "capturas_insert_authenticated"
  on public.capturas_avistamientos for insert
  to authenticated
  with check (auth.uid() = registrado_por);

create policy "capturas_update_owner_or_admin"
  on public.capturas_avistamientos for update
  to authenticated
  using (auth.uid() = registrado_por or public.is_admin())
  with check (auth.uid() = registrado_por or public.is_admin());

create policy "capturas_delete_owner_or_admin"
  on public.capturas_avistamientos for delete
  to authenticated
  using (auth.uid() = registrado_por or public.is_admin());

-- ---------------------------------------------------------------------
-- actividades (mantenimiento de comederos/bebederos, con recordatorio)
-- ---------------------------------------------------------------------
create table public.actividades (
  id uuid primary key default gen_random_uuid(),
  punto_interes_id uuid not null references public.puntos_interes (id) on delete cascade,
  tipo text not null check (tipo in ('rellenado', 'revision', 'reparacion', 'otro')),
  notas text,
  realizado_por uuid not null references public.usuarios (id) default auth.uid(),
  fecha date not null default current_date,
  proxima_fecha_estimada date,
  fecha_registro timestamptz not null default now()
);

comment on table public.actividades is 'Historial de mantenimiento de puntos de interés (rellenados, revisiones...) con recordatorio opcional.';

alter table public.actividades enable row level security;

create policy "actividades_select_authenticated"
  on public.actividades for select
  to authenticated
  using (true);

create policy "actividades_insert_authenticated"
  on public.actividades for insert
  to authenticated
  with check (auth.uid() = realizado_por);

create policy "actividades_update_owner_or_admin"
  on public.actividades for update
  to authenticated
  using (auth.uid() = realizado_por or public.is_admin())
  with check (auth.uid() = realizado_por or public.is_admin());

create policy "actividades_delete_owner_or_admin"
  on public.actividades for delete
  to authenticated
  using (auth.uid() = realizado_por or public.is_admin());

-- ---------------------------------------------------------------------
-- Grants (RLS sigue aplicando por-fila; esto solo habilita el acceso a
-- nivel de tabla para el rol `authenticated`).
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.capturas_avistamientos to authenticated;
grant select, insert, update, delete on public.actividades to authenticated;
