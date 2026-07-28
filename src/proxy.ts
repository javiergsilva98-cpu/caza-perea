import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - icons, sw.js, manifest (PWA assets)
     * - files with an extension (images, etc.)
     */
    "/((?!_next/static|_next/image|icons|sw\\.js|manifest\\.webmanifest|.*\\..*).*)",
  ],
};
