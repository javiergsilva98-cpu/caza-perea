-- Documentación personal de cada cazador (seguro, licencia de caza): un
-- bucket de Storage privado, más una tabla con los metadatos de qué hay
-- subido. Es estrictamente privado — cada cazador solo ve lo suyo, ni
-- siquiera un admin puede ver los documentos de otro cazador.

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false);

-- Los archivos se guardan como "{usuario_id}/{tipo}-{timestamp}.{ext}":
-- comprobamos que el primer segmento de la ruta sea el propio usuario.
create policy "documentos_storage_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "documentos_storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "documentos_storage_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

create table public.documentos_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) default auth.uid(),
  tipo text not null check (tipo in ('seguro', 'licencia')),
  storage_path text not null,
  nombre_archivo text not null,
  fecha_subida timestamptz not null default now(),
  unique (usuario_id, tipo)
);

comment on table public.documentos_usuario is 'Metadatos de los documentos (seguro, licencia) que cada cazador tiene subidos en el bucket "documentos". Privado por cazador.';

alter table public.documentos_usuario enable row level security;

create policy "documentos_usuario_select_own"
  on public.documentos_usuario for select
  to authenticated
  using (auth.uid() = usuario_id);

create policy "documentos_usuario_insert_own"
  on public.documentos_usuario for insert
  to authenticated
  with check (auth.uid() = usuario_id);

create policy "documentos_usuario_update_own"
  on public.documentos_usuario for update
  to authenticated
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

create policy "documentos_usuario_delete_own"
  on public.documentos_usuario for delete
  to authenticated
  using (auth.uid() = usuario_id);

grant select, insert, update, delete on public.documentos_usuario to authenticated;
