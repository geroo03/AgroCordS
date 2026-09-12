/**
 * Bootstrap: valida el entorno (falla rápido si falta algo), arma el
 * cliente de Supabase y la app, y recién ahí escucha en el puerto.
 */

import { cargarConfig } from "./config.js";
import { crearClienteSupabase } from "./lib/supabase.js";
import { crearApp } from "./app.js";

const config = cargarConfig();
const supabase = crearClienteSupabase(config);
const app = crearApp(supabase, config.corsOrigin);

app.listen(config.puerto, () => {
  console.log(`[servidor] escuchando en el puerto ${config.puerto}`);
});
