import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// getSession() lee la sesión guardada localmente sin red: funciona sin
// conexión. getUser() revalida contra el servidor y fallaría offline.
export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserId(session?.user.id ?? null);
    })();
  }, []);

  return userId;
}
