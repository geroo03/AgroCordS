import { defineConfig } from "vitest/config";

// Sin este archivo, vitest escanea TODO el repo por default y también corre
// los tests de server/ (otro proyecto Node, con su propio npm test) y
// cualquiera que aparezca en agrocords---ventana-de-aplicación/ (prototipo
// Vite aparte) — cada uno corre sólo con sus propias dependencias instaladas
// en su carpeta, así que mezclarlos rompe o falsea resultados.
export default defineConfig({
  test: {
    include: ["src/tests/**/*.test.ts"],
  },
});
