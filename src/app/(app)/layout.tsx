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
      <header className="flex items-center justify-between border-b border-border bg-bg-card px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">Casa Perea</p>
          <p className="text-xs text-ink-soft">Coto CU10053</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-border px-3 py-1.5 text-xs text-ink-soft"
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
