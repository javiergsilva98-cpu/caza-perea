-- El calendario de asistencia era estrictamente de "marca tú mismo tus
-- días" (insert/update solo con cazador_id = auth.uid()). Para poder
-- apuntar también a otro socio del grupo, se separa quién asiste
-- (cazador_id) de quién lo registra (registrado_por) — mismo patrón que
-- esperas.asignado_por y jornada_asistentes.registrado_por.
alter table public.calendario_asistencias add column registrado_por uuid references public.usuarios (id);
update public.calendario_asistencias set registrado_por = cazador_id where registrado_por is null;
alter table public.calendario_asistencias alter column registrado_por set not null;
alter table public.calendario_asistencias alter column registrado_por set default auth.uid();

drop policy "calendario_asistencias_insert_own" on public.calendario_asistencias;
create policy "calendario_asistencias_insert_authenticated"
  on public.calendario_asistencias for insert
  to authenticated
  with check (auth.uid() = registrado_por);

drop policy "calendario_asistencias_update_own" on public.calendario_asistencias;
create policy "calendario_asistencias_update_owner_or_admin"
  on public.calendario_asistencias for update
  to authenticated
  using (auth.uid() = registrado_por or public.is_admin())
  with check (auth.uid() = registrado_por or public.is_admin());

drop policy "calendario_asistencias_delete_own_or_admin" on public.calendario_asistencias;
create policy "calendario_asistencias_delete_owner_or_admin"
  on public.calendario_asistencias for delete
  to authenticated
  using (auth.uid() = registrado_por or public.is_admin());
