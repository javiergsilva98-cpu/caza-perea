-- Foto de la jornada: una sola foto por día de caza, del grupo en general,
-- en vez de una foto por cada captura individual. jornada_asistentes y
-- capturas_avistamientos ya agrupan por "fecha" sin necesitar una fila
-- que represente el día en sí — esta tabla es esa fila, con la foto como
-- único dato propio por ahora.
create table public.jornadas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  foto_url text,
  registrado_por uuid not null references public.usuarios (id) default auth.uid(),
  fecha_registro timestamptz not null default now()
);

comment on table public.jornadas is 'Un día de caza — por ahora solo guarda la foto general de la jornada.';

alter table public.jornadas enable row level security;

create policy "jornadas_select_authenticated"
  on public.jornadas for select
  to authenticated
  using (true);

create policy "jornadas_insert_authenticated"
  on public.jornadas for insert
  to authenticated
  with check (auth.uid() = registrado_por);

create policy "jornadas_update_owner_or_admin"
  on public.jornadas for update
  to authenticated
  using (auth.uid() = registrado_por or public.is_admin())
  with check (auth.uid() = registrado_por or public.is_admin());

create policy "jornadas_delete_owner_or_admin"
  on public.jornadas for delete
  to authenticated
  using (auth.uid() = registrado_por or public.is_admin());

grant select, insert, update, delete on public.jornadas to authenticated;
