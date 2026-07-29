-- Bucket público para fotos de capturas, puestos, comederos y bebederos —
-- a diferencia de "documentos" (privado por cazador), esto es contenido
-- compartido del grupo, como el resto de datos de la app.

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true);

create policy "fotos_storage_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'fotos');

create policy "fotos_storage_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'fotos');

create policy "fotos_storage_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'fotos');
