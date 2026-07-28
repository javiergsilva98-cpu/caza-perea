-- Corrige usuarios_prevent_self_role_escalation: tal y como estaba, auth.uid()
-- es NULL tanto en el SQL Editor como en llamadas hechas con la service_role
-- key (ninguna de las dos lleva un JWT de usuario con "sub"), así que
-- is_admin() siempre daba false y el trigger bloqueaba CUALQUIER cambio de
-- rol — incluido el arranque inicial para nombrar al primer admin.
--
-- Solución: solo exigir la comprobación de is_admin() cuando la petición
-- viene de un cliente autenticado normal (auth.role() = 'authenticated').
-- El SQL Editor y la service_role key (auth.role() devuelve NULL o
-- 'service_role') quedan fuera de esta comprobación, igual que ya quedan
-- fuera de RLS — es el mismo nivel de confianza.
create or replace function public.usuarios_prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rol is distinct from old.rol
     and auth.role() = 'authenticated'
     and not public.is_admin() then
    raise exception 'Solo un admin puede cambiar el rol de un usuario';
  end if;
  return new;
end;
$$;
