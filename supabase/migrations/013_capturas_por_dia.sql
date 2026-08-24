-- El registro de capturas pasa a organizarse por día: además de quién
-- registra cada pieza, ahora se guarda quién la cazó de verdad
-- (cazador_id), y se puede anotar quién estuvo presente ese día aunque no
-- cazara nada (jornada_asistentes) — igual que esperas separa
-- asignado_por de cazador_id.

-- ---------------------------------------------------------------------
-- jornada_asistentes: quién estuvo presente cada día de caza.
-- ---------------------------------------------------------------------
create table public.jornada_asistentes (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  cazador_id uuid not null references public.usuarios (id),
  registrado_por uuid not null references public.usuarios (id) default auth.uid(),
  fecha_registro timestamptz not null default now(),
  unique (fecha, cazador_id)
);

comment on table public.jornada_asistentes is 'Cazadores presentes cada día de caza, cazaran algo o no.';

alter table public.jornada_asistentes enable row level security;

create policy "jornada_asistentes_select_authenticated"
  on public.jornada_asistentes for select
  to authenticated
  using (true);

create policy "jornada_asistentes_insert_authenticated"
  on public.jornada_asistentes for insert
  to authenticated
  with check (auth.uid() = registrado_por);

create policy "jornada_asistentes_delete_owner_or_admin"
  on public.jornada_asistentes for delete
  to authenticated
  using (auth.uid() = registrado_por or public.is_admin());

grant select, insert, delete on public.jornada_asistentes to authenticated;

-- ---------------------------------------------------------------------
-- capturas_avistamientos: quién cazó cada pieza, no solo quién la anotó.
-- Se rellena con registrado_por para las filas ya existentes.
-- ---------------------------------------------------------------------
alter table public.capturas_avistamientos add column cazador_id uuid references public.usuarios (id);
update public.capturas_avistamientos set cazador_id = registrado_por where cazador_id is null;
alter table public.capturas_avistamientos alter column cazador_id set not null;
alter table public.capturas_avistamientos alter column cazador_id set default auth.uid();
