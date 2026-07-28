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
      <h1 className="text-xl font-semibold text-foreground">Perfil</h1>

      <dl className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex justify-between gap-4">
          <dt className="text-foreground/60">Nombre</dt>
          <dd className="text-foreground">{perfil?.nombre ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-foreground/60">Email</dt>
          <dd className="text-foreground">{user.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-foreground/60">Rol</dt>
          <dd className="text-foreground capitalize">{perfil?.rol ?? "—"}</dd>
        </div>
      </dl>

      {perfil?.rol === "admin" && <InvitarUsuarioPanel />}

      <form action={logout}>
        <button
          type="submit"
          className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm font-medium text-foreground dark:border-white/15"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
