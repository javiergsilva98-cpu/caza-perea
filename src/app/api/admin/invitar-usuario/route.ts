import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generarPasswordTemporal } from "@/lib/auth/generar-password";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();
  if (perfil?.rol !== "admin") {
    return NextResponse.json({ error: "Solo un admin puede invitar usuarios" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";
  const comoAdmin = body?.comoAdmin === true;

  if (!email || !nombre) {
    return NextResponse.json({ error: "Faltan el nombre o el email" }, { status: 400 });
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No configurado" },
      { status: 500 }
    );
  }

  const password = generarPasswordTemporal();

  const { data: created, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  });

  if (error || !created?.user) {
    const mensaje = error?.message.includes("already been registered")
      ? "Ya existe un usuario con ese email"
      : (error?.message ?? "No se ha podido crear el usuario");
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }

  if (comoAdmin) {
    await adminClient.from("usuarios").update({ rol: "admin" }).eq("id", created.user.id);
  }

  return NextResponse.json({ email, password });
}
