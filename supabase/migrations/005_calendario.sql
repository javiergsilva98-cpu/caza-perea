-- Calendario de asistencia: cada cazador marca los días que va al coto.
-- Las capturas, actividades y esperas de ese mismo día se muestran juntas
-- en la pantalla de Calendario a partir de su propio campo `fecha`, sin
-- necesidad de enlazarlas aquí.

create table public.calendario_asistencias (
  id uuid primary key default gen_random_uuid(),
  cazador_id uuid not null references public.usuarios (id) default auth.uid(),
  fecha date not null,
  notas text,
  fecha_registro timestamptz not null default now(),
  unique (cazador_id, fecha)
);

comment on table public.calendario_asistencias is 'Días en que cada cazador marca que va a ir al coto.';

alter table public.calendario_asistencias enable row level security;

create policy "calendario_asistencias_select_authenticated"
  on public.calendario_asistencias for select
  to authenticated
  using (true);

create policy "calendario_asistencias_insert_own"
  on public.calendario_asistencias for insert
  to authenticated
  with check (auth.uid() = cazador_id);

create policy "calendario_asistencias_update_own"
  on public.calendario_asistencias for update
  to authenticated
  using (auth.uid() = cazador_id)
  with check (auth.uid() = cazador_id);

create policy "calendario_asistencias_delete_own_or_admin"
  on public.calendario_asistencias for delete
  to authenticated
  using (auth.uid() = cazador_id or public.is_admin());

grant select, insert, update, delete on public.calendario_asistencias to authenticated;
