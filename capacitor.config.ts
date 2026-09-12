import type { CapacitorConfig } from "@capacitor/cli";

/**
 * La app Android es un envoltorio nativo (WebView) sobre el sitio ya
 * desplegado en Vercel — no se empaqueta el frontend estático, porque la app
 * depende de rutas de servidor de Next.js (chat, forecast, satélite, pagos)
 * que no existen fuera de ese despliegue. `webDir` apunta a un placeholder
 * mínimo que nunca se muestra: `server.url` reemplaza el contenido cargado.
 */
const config: CapacitorConfig = {
  appId: "com.agrocords.ventana",
  appName: "AgroCordS",
  webDir: "www",
  server: {
    url: "https://agro-ia-orcin.vercel.app",
    androidScheme: "https",
  },
};

export default config;
