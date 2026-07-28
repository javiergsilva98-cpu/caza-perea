import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";
import { logout } from "./actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
        <div>
          <p className="text-sm font-semibold text-foreground">Casa Perea</p>
          <p className="text-xs text-foreground/50">Coto CU10053</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-foreground/70 dark:border-white/15"
          >
            Salir
          </button>
        </form>
      </header>

      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>

      <BottomNav />
    </div>
  );
}
