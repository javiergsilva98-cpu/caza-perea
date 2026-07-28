import { createClient } from "@/lib/supabase/client";

export interface UsuarioBasico {
  id: string;
  nombre: string;
}

export async function listUsuarios(): Promise<UsuarioBasico[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre")
    .order("nombre", { ascending: true });
  if (error || !data) return [];
  return data;
}

export async function listUsuariosNombres(): Promise<Record<string, string>> {
  const usuarios = await listUsuarios();
  return Object.fromEntries(usuarios.map((u) => [u.id, u.nombre]));
}
