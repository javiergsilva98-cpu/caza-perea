import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { AppHeader } from "@/components/AppHeader";
import { MapToolsProvider } from "@/lib/map-tools-context";

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
    <MapToolsProvider>
      <div className="flex min-h-dvh flex-col">
        <AppHeader />

        <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>

        <AppNav />
      </div>
    </MapToolsProvider>
  );
}
