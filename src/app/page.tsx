import { redirect } from "next/navigation";

// Entra por /login (con "Seguir sin cuenta" siempre visible ahí como salida
// directa a /lotes) — el login sigue simulado, no bloquea el modo local de
// siempre, sólo es lo primero que se ve.
export default function Inicio() {
  redirect("/login");
}
