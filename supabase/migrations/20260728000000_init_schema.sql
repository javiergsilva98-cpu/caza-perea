-- Casa Perea (CU10053) — esquema inicial
-- Tablas: usuarios, puntos_interes, finca_limite (con historial de versiones)
--
-- Tablas previstas para sprints futuros (NO se crean aquí, solo se deja
-- constancia para no romper el esquema más adelante):
--   - capturas_avistamientos: referenciará puntos_interes(id) y usuarios(id)
--   - gastos: referenciará usuarios(id)
--   - actividades: referenciará puntos_interes(id) y usuarios(id), con campo
--     tipo ('rellenado_comedero' | 'rellenado_bebedero' | ...) y próxima
--     fecha estimada para recordatorios

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- usuarios
-- ---------------------------------------------------------------------
create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol text not null default 'cazador' check (rol in ('admin', 'cazador')),
  fecha_alta timestamptz not null default now()
);

comment on table public.usuarios is 'Perfil y rol de cada usuario de la app, uno a uno con auth.users.';

-- Helper: ¿el usuario autenticado actual es admin?
-- security definer para poder usarse dentro de las policies de RLS sin
-- recursión infinita al consultar la propia tabla usuarios. Definida
-- después de crear `usuarios` porque las funciones `language sql` se
-- validan contra el catálogo en el momento de crearse (a diferencia de
-- las `plpgsql`, que se resuelven en tiempo de ejecución).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios where id = auth.uid() and rol = 'admin'
  );
$$;

alter table public.usuarios enable row level security;

-- Cualquier usuario autenticado puede ver la lista de usuarios (nombres
-- para asignaciones, turnos, etc. en sprints futuros).
create policy "usuarios_select_authenticated"
  on public.usuarios for select
  to authenticated
  using (true);

-- Un usuario puede editar su propio perfil; un admin puede editar cualquiera.
-- El cambio de rol está además protegido por el trigger de abajo.
create policy "usuarios_update_self_or_admin"
  on public.usuarios for update
  to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "usuarios_delete_admin"
  on public.usuarios for delete
  to authenticated
  using (public.is_admin());

-- Sin policy de insert: las filas se crean únicamente vía el trigger
-- on_auth_user_created (security definer), nunca directamente por el cliente.

-- Evita que un usuario no-admin se autopromocione a admin.
create or replace function public.usuarios_prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rol is distinct from old.rol and not public.is_admin() then
    raise exception 'Solo un admin puede cambiar el rol de un usuario';
  end if;
  return new;
end;
$$;

create trigger usuarios_before_update_trg
  before update on public.usuarios
  for each row execute function public.usuarios_prevent_self_role_escalation();

-- Crea automáticamente la fila de usuarios al darse de alta en auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    'cazador'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- puntos_interes (comederos, bebederos, puestos, etc.)
-- ---------------------------------------------------------------------
create table public.puntos_interes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null check (tipo in ('comedero', 'bebedero', 'puesto', 'otro')),
  lat double precision not null,
  lng double precision not null,
  notas text,
  foto_url text,
  creado_por uuid not null references public.usuarios (id) default auth.uid(),
  fecha_creacion timestamptz not null default now()
);

comment on table public.puntos_interes is 'Puntos de interés de la finca: comederos, bebederos, puestos, etc.';

alter table public.puntos_interes enable row level security;

create policy "puntos_interes_select_authenticated"
  on public.puntos_interes for select
  to authenticated
  using (true);

create policy "puntos_interes_insert_authenticated"
  on public.puntos_interes for insert
  to authenticated
  with check (auth.uid() = creado_por);

create policy "puntos_interes_update_owner_or_admin"
  on public.puntos_interes for update
  to authenticated
  using (auth.uid() = creado_por or public.is_admin())
  with check (auth.uid() = creado_por or public.is_admin());

create policy "puntos_interes_delete_owner_or_admin"
  on public.puntos_interes for delete
  to authenticated
  using (auth.uid() = creado_por or public.is_admin());

-- ---------------------------------------------------------------------
-- finca_limite (linde de la finca, GeoJSON)
-- Tabla de solo-inserción: cada edición crea una nueva versión, lo que da
-- historial completo sin necesidad de una tabla de auditoría aparte.
-- La versión "actual" es la de mayor `version` (ver vista de abajo).
-- ---------------------------------------------------------------------
create table public.finca_limite (
  id uuid primary key default gen_random_uuid(),
  version integer not null,
  geometria jsonb not null,
  actualizado_por uuid not null references public.usuarios (id) default auth.uid(),
  fecha_actualizacion timestamptz not null default now()
);

comment on table public.finca_limite is 'Historial de versiones del polígono (GeoJSON) de la linde de la finca.';
comment on column public.finca_limite.geometria is 'Polígono GeoJSON (Feature o Polygon) de la linde de la finca.';

create unique index finca_limite_version_unique on public.finca_limite (version);

create or replace function public.finca_limite_set_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.version is null or new.version <= 0 then
    select coalesce(max(version), 0) + 1 into new.version from public.finca_limite;
  end if;
  return new;
end;
$$;

create trigger finca_limite_set_version_trg
  before insert on public.finca_limite
  for each row execute function public.finca_limite_set_version();

alter table public.finca_limite enable row level security;

create policy "finca_limite_select_authenticated"
  on public.finca_limite for select
  to authenticated
  using (true);

create policy "finca_limite_insert_authenticated"
  on public.finca_limite for insert
  to authenticated
  with check (auth.uid() = actualizado_por);

create policy "finca_limite_delete_admin"
  on public.finca_limite for delete
  to authenticated
  using (public.is_admin());

-- Sin policy de update: el historial es inmutable, las correcciones son
-- nuevas versiones (nuevas filas).

create view public.finca_limite_actual
  with (security_invoker = true) as
  select * from public.finca_limite
  order by version desc
  limit 1;

comment on view public.finca_limite_actual is 'Última versión (vigente) de la linde de la finca.';

-- ---------------------------------------------------------------------
-- Grants (RLS sigue aplicando por-fila; esto solo habilita el acceso a
-- nivel de tabla para el rol `authenticated`).
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.usuarios to authenticated;
grant select, insert, update, delete on public.puntos_interes to authenticated;
grant select, insert, delete on public.finca_limite to authenticated;
grant select on public.finca_limite_actual to authenticated;
