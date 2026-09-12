import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "./globals.css";
import AplicarPreferencias from "@/components/ui/AplicarPreferencias";
import AppShell from "@/components/ui/AppShell";

// Space Grotesk: la tipografía del sistema de diseño AgroCordS, una sola
// familia con identidad propia (ver globals.css). El tamaño sigue siendo
// elegible desde /ajustes, la familia ya no.
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

export const metadata: Metadata = {
  title: "AgroCordS — Ventana de Aplicación",
  description:
    "Decide si se puede pulverizar un lote, hora por hora, durante las próximas 72 h.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={grotesk.variable}>
      <body className="lienzo-foto font-sans antialiased">
        <AplicarPreferencias />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
