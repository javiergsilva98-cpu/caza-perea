import { createClient } from "@/lib/supabase/client";

export async function listUsuariosNombres(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("usuarios").select("id, nombre");
  if (error || !data) return {};
  return Object.fromEntries(data.map((u) => [u.id, u.nombre]));
}
