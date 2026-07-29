import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  esUrlGoogleMapsPermitida,
  esRedirectGoogleMapsPermitida,
  extraerCoordsDeUrlGoogleMaps,
} from "@/lib/geo/google-maps";

const MAX_SALTOS = 5;

// Sigue la redirección salto a salto (en vez de dejar que fetch la siga
// sola) para comprobar en cada uno que sigue dentro de dominios de Google
// permitidos. Sin esto, un enlace corto manipulado podría hacer que el
// servidor llegase a contactar con un destino arbitrario a mitad de la
// cadena, aunque el enlace de entrada estuviera validado.
async function resolverRedireccion(inicial: URL): Promise<string> {
  let actual = inicial;
  for (let i = 0; i < MAX_SALTOS; i++) {
    const res = await fetch(actual.toString(), {
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CasaPereaBot/1.0)" },
    });

    if (res.status < 300 || res.status >= 400) {
      return actual.toString();
    }

    const location = res.headers.get("location");
    if (!location) throw new Error("Redirección sin destino");

    const siguiente = esRedirectGoogleMapsPermitida(new URL(location, actual).toString());
    if (!siguiente) throw new Error("Redirección fuera de los dominios permitidos");
    actual = siguiente;
  }
  throw new Error("Demasiadas redirecciones");
}

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
    // Sigue la redirección del enlace corto en el servidor (el navegador no
    // puede leer la URL final de una redirección entre orígenes distintos),
    // salto a salto y validando cada uno — ver resolverRedireccion().
    finalUrl = await resolverRedireccion(parsed);
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
