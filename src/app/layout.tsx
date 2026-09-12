import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "./globals.css";
import AppShell from "@/components/ui/AppShell";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

export const metadata: Metadata = {
  title: "Ventana de Aplicación",
  description:
    "Decide si se puede pulverizar un lote, hora por hora, durante las próximas 72 h.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={grotesk.variable}>
      <body className="app-fondo font-sans text-tinta antialiased">
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
