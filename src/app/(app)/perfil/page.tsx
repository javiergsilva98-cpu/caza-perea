import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../actions";
import { InvitarUsuarioPanel } from "@/components/perfil/InvitarUsuarioPanel";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nombre, rol, fecha_alta")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="text-xl font-semibold text-ink">Perfil</h1>

      <dl className="flex flex-col gap-3 rounded-xl border border-border bg-bg-card p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">Nombre</dt>
          <dd className="text-ink">{perfil?.nombre ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">Email</dt>
          <dd className="text-ink">{user.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">Rol</dt>
          <dd className="text-ink capitalize">{perfil?.rol ?? "—"}</dd>
        </div>
      </dl>

      {perfil?.rol === "admin" && <InvitarUsuarioPanel />}

      <form action={logout}>
        <button
          type="submit"
          className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
