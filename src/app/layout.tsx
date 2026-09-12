import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "./globals.css";
import BarraNavegacion from "@/components/ui/BarraNavegacion";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });

export const metadata: Metadata = {
  title: "Ventana de Aplicación",
  description:
    "Decide si se puede pulverizar un lote, hora por hora, durante las próximas 72 h.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={archivo.variable}>
      <body className="font-sans antialiased">
        <main className="mx-auto min-h-dvh w-full max-w-[480px] bg-papel pb-16">
          {children}
        </main>
        <BarraNavegacion />
      </body>
    </html>
  );
}
