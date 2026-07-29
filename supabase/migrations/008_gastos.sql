-- Histórico de gastos de la finca (comida, mantenimiento, gasolina...).
-- Solo registro, sin cálculo de reparto entre cazadores por ahora.
--
-- Igual que en esperas: quien registra el gasto (registrado_por) no tiene
-- por qué ser quien lo pagó (pagado_por) — cualquiera puede apuntar un
-- gasto que ha pagado otro cazador.

create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  concepto text not null,
  importe numeric(10, 2) not null check (importe > 0),
  pagado_por uuid not null references public.usuarios (id),
  fecha date not null,
  notas text,
  registrado_por uuid not null references public.usuarios (id) default auth.uid(),
  fecha_registro timestamptz not null default now()
);

comment on table public.gastos is 'Histórico de gastos de la finca. Sin cálculo de reparto — solo registro.';

alter table public.gastos enable row level security;

create policy "gastos_select_authenticated"
  on public.gastos for select
  to authenticated
  using (true);

create policy "gastos_insert_authenticated"
  on public.gastos for insert
  to authenticated
  with check (auth.uid() = registrado_por);

create policy "gastos_update_owner_or_admin"
  on public.gastos for update
  to authenticated
  using (auth.uid() = registrado_por or public.is_admin())
  with check (auth.uid() = registrado_por or public.is_admin());

create policy "gastos_delete_owner_or_admin"
  on public.gastos for delete
  to authenticated
  using (auth.uid() = registrado_por or public.is_admin());

grant select, insert, update, delete on public.gastos to authenticated;
