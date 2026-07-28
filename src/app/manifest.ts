import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Casa Perea — Coto CU10053",
    short_name: "Casa Perea",
    description: "Gestión del coto de caza CU10053 (Cuenca) — Casa Perea.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#efe8d8",
    theme_color: "#4a5d3a",
    lang: "es",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
