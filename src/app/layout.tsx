import type { Metadata } from "next";
import { Archivo, Atkinson_Hyperlegible, Lexend, Nunito } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "./globals.css";
import AplicarPreferencias from "@/components/ui/AplicarPreferencias";
import BarraNavegacion from "@/components/ui/BarraNavegacion";

// Cuatro familias, cada una con un motivo (ver /ajustes): Archivo es la
// tipografía de origen del proyecto; las otras tres están elegidas por
// legibilidad, no por variedad. Las cuatro quedan siempre cargadas como
// variables CSS — elegir una no descarga a las demás — porque /ajustes
// necesita mostrar la vista previa de las cuatro a la vez.
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const legible = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-legible",
});
const redondeada = Nunito({ subsets: ["latin"], variable: "--font-redondeada" });
const lectura = Lexend({ subsets: ["latin"], variable: "--font-lectura" });

export const metadata: Metadata = {
  title: "Ventana de Aplicación",
  description:
    "Decide si se puede pulverizar un lote, hora por hora, durante las próximas 72 h.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${archivo.variable} ${legible.variable} ${redondeada.variable} ${lectura.variable}`}
    >
      <body className="font-sans antialiased">
        <AplicarPreferencias />
        <main className="mx-auto min-h-dvh w-full max-w-[480px] bg-lienzo pb-24">
          {children}
        </main>
        <BarraNavegacion />
      </body>
    </html>
  );
}
