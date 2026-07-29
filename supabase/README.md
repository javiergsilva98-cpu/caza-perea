# Supabase — Casa Perea

## Aplicar el esquema

Los archivos de `migrations/` están numerados (`001`, `002`, `003`...) y hay
que ejecutarlos **en ese orden**, una sola vez cada uno. Opción rápida (sin
instalar nada): abre el **SQL Editor** del proyecto en
[supabase.com/dashboard](https://supabase.com/dashboard), pega el contenido
del primero que no hayas ejecutado todavía, dale a Run, y repite con el
siguiente.

Opción con la CLI de Supabase (recomendada si en algún momento se quiere
automatizar):

```bash
npm install -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

## Dar de alta usuarios

No hay registro público. Para el primer usuario (tú, como admin), créalo a
mano desde **Authentication → Users → Add user** en el dashboard de
Supabase (con email y contraseña, marcando "Auto Confirm User"). Al crearse
el usuario en `auth.users`, un trigger (`on_auth_user_created`) crea
automáticamente su fila en `public.usuarios` con rol `cazador`.

Para el resto de cazadores, ya no hace falta el dashboard: como admin,
entra en la app → Perfil → "+ Invitar cazador". Necesita la variable de
entorno `SUPABASE_SERVICE_ROLE_KEY` configurada (ver `.env.example`).

Para convertir tu propio usuario en `admin` la primera vez, ejecuta una vez
en el SQL Editor (sustituyendo el email):

```sql
update public.usuarios
set rol = 'admin'
where id = (select id from auth.users where email = 'tu-email@example.com');
```

## Modelo de datos

- `usuarios`: perfil (nombre, rol) 1-a-1 con `auth.users`.
- `puntos_interes`: comederos, bebederos, puestos, etc.
- `finca_limite`: historial de versiones de la linde de la finca (GeoJSON).
  Cada edición inserta una fila nueva con `version` incremental; la vista
  `finca_limite_actual` expone siempre la última.
- `capturas_avistamientos`: registro de capturas y avistamientos (especie,
  cantidad, fecha, notas).
- `actividades`: mantenimiento de puntos de interés (rellenado, revisión,
  reparación), con fecha estimada de la próxima para recordatorios.
- `esperas`: asignación de cazadores a puestos en fechas concretas.
- `calendario_asistencias`: días en que cada cazador marca que va al coto.
- `documentos_usuario`: metadatos (tipo, ruta, nombre de archivo) de los
  documentos personales (seguro, licencia) subidos al bucket de Storage
  `documentos`. A diferencia del resto, es **estrictamente privado**: cada
  cazador solo ve y gestiona los suyos, ni siquiera un admin puede ver los
  de otro (mismas policies en `storage.objects`, por carpeta `{usuario_id}/`).
- `gastos`: histórico de gastos de la finca (concepto, importe, quién lo
  pagó, fecha). Solo registro — sin cálculo de reparto entre cazadores.

RLS está activada en todas: cualquier usuario autenticado puede leer todo
(salvo `documentos_usuario`, que es privado por cazador), pero solo puede
editar/borrar lo suyo (o cualquier admin, salvo en documentos). Ver
comentarios en cada migración para el detalle de las policies.
