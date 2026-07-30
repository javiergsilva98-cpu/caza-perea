import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Splash screens de arranque en iOS: Safari no las genera solas a partir del
// icon ni del theme_color, hay que darle una imagen exacta por tamaño de
// pantalla y orientación o se ve un parpadeo en blanco al abrir la app.
const splashDevices = [
  { name: "6-9", w: 440, h: 956, scale: 3 },
  { name: "6-3", w: 402, h: 874, scale: 3 },
  { name: "6-1", w: 393, h: 852, scale: 3 },
  { name: "6-7", w: 430, h: 932, scale: 3 },
  { name: "5-8", w: 375, h: 812, scale: 3 },
  { name: "4-7", w: 375, h: 667, scale: 2 },
];

// Next.js desduplica y transmite el <head> él mismo — añadir <link> a mano
// en el root layout rompe ese mecanismo, así que las startup images se
// declaran aquí y las genera la Metadata API.
const startupImages = splashDevices.flatMap((d) => [
  {
    url: `/icons/splash/${d.name}-portrait.png`,
    media: `(device-width: ${d.w}px) and (device-height: ${d.h}px) and (-webkit-device-pixel-ratio: ${d.scale}) and (orientation: portrait)`,
  },
  {
    url: `/icons/splash/${d.name}-landscape.png`,
    media: `(device-width: ${d.w}px) and (device-height: ${d.h}px) and (-webkit-device-pixel-ratio: ${d.scale}) and (orientation: landscape)`,
  },
]);

export const metadata: Metadata = {
  metadataBase: new URL("https://caza-perea.vercel.app"),
  title: "Casa Perea — Coto CU10053",
  description: "Gestión del coto de caza CU10053 (Cuenca) — Casa Perea.",
  appleWebApp: {
    capable: true,
    // "black-translucent" deja que el contenido llegue hasta arriba, bajo
    // una barra de estado translúcida — con "default" (blanco fijo) la
    // barra desentonaba de golpe en modo oscuro. Requiere viewportFit:
    // "cover" (ver más abajo) y que el propio contenido respete
    // env(safe-area-inset-top) donde haga falta.
    statusBarStyle: "black-translucent",
    title: "Casa Perea",
    startupImage: startupImages,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Sin esto, env(safe-area-inset-*) siempre vale 0px — el padding que ya
  // se usa en las hojas inferiores y los botones flotantes del mapa para
  // el home indicator/notch del iPhone no se aplicaba nunca de verdad.
  viewportFit: "cover",
  themeColor: "#4a5d3a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-bg text-ink">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
