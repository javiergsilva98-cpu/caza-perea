# Supabase — Casa Perea

## Aplicar el esquema

Opción rápida (sin instalar nada): abre el **SQL Editor** del proyecto en
[supabase.com/dashboard](https://supabase.com/dashboard) y pega el contenido
de `migrations/20260728000000_init_schema.sql`. Ejecútalo una vez.

Opción con la CLI de Supabase (recomendada a partir de la 2ª migración):

```bash
npm install -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

## Dar de alta usuarios

No hay registro público: los tres usuarios se crean a mano desde
**Authentication → Users → Add user** en el dashboard de Supabase (con email
y contraseña). Al crearse el usuario en `auth.users`, un trigger
(`on_auth_user_created`) crea automáticamente su fila en `public.usuarios`
con rol `cazador`.

Para convertir el usuario propio en `admin`, ejecuta una vez en el SQL Editor
(sustituyendo el email):

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

RLS está activada en las tres tablas: cualquier usuario autenticado puede
leer todo, pero solo puede editar/borrar lo suyo (o cualquier admin). Ver
comentarios en la propia migración para el detalle de cada policy.

Tablas previstas para sprints futuros (no creadas todavía, pero tenidas en
cuenta en el diseño): `capturas_avistamientos`, `gastos`, `actividades`.
