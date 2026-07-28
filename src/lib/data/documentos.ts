import { createClient } from "@/lib/supabase/client";
import type { TipoDocumento } from "@/lib/supabase/database.types";

export interface DocumentoUsuario {
  id: string;
  tipo: TipoDocumento;
  storage_path: string;
  nombre_archivo: string;
  fecha_subida: string;
}

const BUCKET = "documentos";

async function currentUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");
  return session.user.id;
}

// Los documentos requieren conexión (no se guardan offline): son archivos
// binarios y solo tienen sentido para verlos o compartirlos en el momento.
export async function listDocumentos(): Promise<DocumentoUsuario[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documentos_usuario")
    .select("id, tipo, storage_path, nombre_archivo, fecha_subida");
  if (error || !data) return [];
  return data;
}

export async function subirDocumento(tipo: TipoDocumento, file: File): Promise<DocumentoUsuario> {
  const supabase = createClient();
  const usuario_id = await currentUserId();

  const { data: anterior } = await supabase
    .from("documentos_usuario")
    .select("storage_path")
    .eq("tipo", tipo)
    .maybeSingle();

  const extension = file.name.includes(".") ? file.name.split(".").pop() : undefined;
  const storagePath = `${usuario_id}/${tipo}-${Date.now()}${extension ? `.${extension}` : ""}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type || undefined,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("documentos_usuario")
    .upsert(
      {
        usuario_id,
        tipo,
        storage_path: storagePath,
        nombre_archivo: file.name,
      },
      { onConflict: "usuario_id,tipo" }
    )
    .select("id, tipo, storage_path, nombre_archivo, fecha_subida")
    .single();

  if (error || !data) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw error ?? new Error("No se ha podido guardar el documento");
  }

  if (anterior?.storage_path) {
    await supabase.storage.from(BUCKET).remove([anterior.storage_path]);
  }

  return data;
}

export async function borrarDocumento(doc: DocumentoUsuario): Promise<void> {
  const supabase = createClient();
  await supabase.from("documentos_usuario").delete().eq("id", doc.id);
  await supabase.storage.from(BUCKET).remove([doc.storage_path]);
}

export async function urlDocumento(storagePath: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60);
  if (error || !data) return null;
  return data.signedUrl;
}
