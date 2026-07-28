-- Sprint 3: gestión de esperas/puestos — asignar cazadores a puestos en
-- fechas concretas, para poder rotar quién va a cada uno.
--
-- A diferencia de las tablas anteriores, aquí quien crea el registro
-- (asignado_por) no tiene por qué ser quien ocupa el puesto (cazador_id):
-- cualquiera puede organizar el reparto y asignar a otro cazador.

create table public.esperas (
  id uuid primary key default gen_random_uuid(),
  puesto_id uuid not null references public.puntos_interes (id) on delete cascade,
  cazador_id uuid not null references public.usuarios (id),
  fecha date not null,
  notas text,
  asignado_por uuid not null references public.usuarios (id) default auth.uid(),
  fecha_registro timestamptz not null default now(),
  unique (puesto_id, fecha)
);

comment on table public.esperas is 'Asignación de cazadores a puestos en fechas concretas, para rotar entre esperas.';

alter table public.esperas enable row level security;

create policy "esperas_select_authenticated"
  on public.esperas for select
  to authenticated
  using (true);

create policy "esperas_insert_authenticated"
  on public.esperas for insert
  to authenticated
  with check (auth.uid() = asignado_por);

create policy "esperas_update_owner_or_admin"
  on public.esperas for update
  to authenticated
  using (auth.uid() = asignado_por or public.is_admin())
  with check (auth.uid() = asignado_por or public.is_admin());

create policy "esperas_delete_owner_or_admin"
  on public.esperas for delete
  to authenticated
  using (auth.uid() = asignado_por or public.is_admin());

grant select, insert, update, delete on public.esperas to authenticated;
