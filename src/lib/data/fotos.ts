import { createClient } from "@/lib/supabase/client";

const BUCKET = "fotos";

// Requiere conexión — a diferencia del resto de la app, no se guarda en
// cola offline. Si falla (sin cobertura), quien llama debe seguir adelante
// sin foto y dejar que se añada más tarde editando.
export async function subirFoto(carpeta: string, file: File): Promise<string> {
  const supabase = createClient();
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${carpeta}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
