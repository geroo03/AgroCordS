import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prototipo Vite aparte (agrocords---ventana-de-aplicación/): tiene sus
    // propias dependencias y config, no forma parte de esta app Next.js.
    "agrocords---ventana-de-aplicación/**",
  ]),
]);

export default eslintConfig;
