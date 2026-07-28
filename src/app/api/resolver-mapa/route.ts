import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { esUrlGoogleMapsPermitida, extraerCoordsDeUrlGoogleMaps } from "@/lib/geo/google-maps";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url : null;
  if (!url) {
    return NextResponse.json({ error: "Falta la URL" }, { status: 400 });
  }

  const parsed = esUrlGoogleMapsPermitida(url);
  if (!parsed) {
    return NextResponse.json(
      { error: "Solo se admiten enlaces de Google Maps (maps.app.goo.gl, google.com/maps...)" },
      { status: 400 }
    );
  }

  let finalUrl: string;
  try {
    // Sigue la redirección del enlace corto en el servidor: el navegador no
    // puede leer la URL final de una redirección entre orígenes distintos.
    const res = await fetch(parsed.toString(), {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CasaPereaBot/1.0)" },
    });
    finalUrl = res.url;
  } catch {
    return NextResponse.json({ error: "No se ha podido abrir ese enlace" }, { status: 502 });
  }

  const coords = extraerCoordsDeUrlGoogleMaps(finalUrl);
  if (!coords) {
    return NextResponse.json(
      { error: "No se han encontrado coordenadas en ese enlace" },
      { status: 422 }
    );
  }

  return NextResponse.json(coords);
}
