-- Lista compartida de cosas que llevar al coto (como una maleta común):
-- cualquiera añade un ítem, cualquiera lo marca como llevado, y cada ítem
-- tiene un responsable (quien lo añade por defecto, reasignable a otro
-- cazador). Es una lista persistente, no ligada a una fecha concreta: antes
-- de cada fin de semana se "reinicia" (se desmarcan los ítems) en vez de
-- volver a escribirla entera.

create table public.lista_maleta (
  id uuid primary key default gen_random_uuid(),
  texto text not null,
  hecho boolean not null default false,
  responsable uuid not null references public.usuarios (id),
  creado_por uuid not null references public.usuarios (id) default auth.uid(),
  fecha_creacion timestamptz not null default now()
);

comment on table public.lista_maleta is 'Lista compartida de cosas a llevar al coto, con responsable por ítem.';

alter table public.lista_maleta enable row level security;

create policy "lista_maleta_select_authenticated"
  on public.lista_maleta for select
  to authenticated
  using (true);

create policy "lista_maleta_insert_authenticated"
  on public.lista_maleta for insert
  to authenticated
  with check (auth.uid() = creado_por);

-- Cualquiera puede marcar un ítem como llevado o reasignar el responsable:
-- es una lista compartida, no de uso exclusivo de quien la creó.
create policy "lista_maleta_update_authenticated"
  on public.lista_maleta for update
  to authenticated
  using (true)
  with check (true);

create policy "lista_maleta_delete_owner_or_admin"
  on public.lista_maleta for delete
  to authenticated
  using (auth.uid() = creado_por or public.is_admin());

grant select, insert, update, delete on public.lista_maleta to authenticated;
