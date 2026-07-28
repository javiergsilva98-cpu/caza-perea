import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nombre, rol")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Hola{perfil?.nombre ? `, ${perfil.nombre}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          {perfil?.rol === "admin" ? "Administrador" : "Cazador"} · Coto CU10053
        </p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
        <p className="text-sm text-foreground/70">
          Infraestructura lista. El mapa, las capturas y las actividades
          llegarán en los próximos sprints — usa la navegación de abajo para
          ver el hueco reservado a cada sección.
        </p>
      </div>
    </div>
  );
}
