"use client";

import { useEffect, useState } from "react";
import IconoClay from "@/components/ui/IconoClay";
import { GlifoAjustes } from "@/components/ui/iconos/Glifos";
import {
  ESCALA_TAMANO,
  ETIQUETA_TAMANO,
  aplicarPreferencias,
  guardarPreferencias,
  leerPreferencias,
  type TamanoFuente,
} from "@/lib/preferencias";

const TAMANOS: TamanoFuente[] = ["normal", "grande", "muy_grande"];
const MUESTRA = "Condiciones favorables";

export default function PaginaAjustes() {
  const [tamano, setTamano] = useState<TamanoFuente>("normal");

  useEffect(() => {
    setTamano(leerPreferencias().tamano);
  }, []);

  const cambiar = (siguiente: TamanoFuente) => {
    setTamano(siguiente);
    guardarPreferencias({ tamano: siguiente });
    aplicarPreferencias({ tamano: siguiente });
  };

  return (
    <div className="px-5 pb-28">
      <header className="flex items-center gap-3 py-6">
        <IconoClay tono="azul" tamano="md">
          <GlifoAjustes />
        </IconoClay>
        <div>
          <h1 className="text-2xl font-extrabold text-tinta">Ajustes de lectura</h1>
          <p className="mt-0.5 text-sm font-medium text-tinta/70">
            Elegí qué tan grande se ve el texto en todas las pantallas.
          </p>
        </div>
      </header>

      <section className="clay-elevado rounded-3xl p-5">
        <p className="text-lg font-bold text-tinta">Vista previa</p>
        <p className="clay-hundido mt-3 rounded-2xl p-5 text-2xl leading-snug font-extrabold text-optima">
          {MUESTRA}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-tinta">Tamaño del texto</h2>
        <p className="mt-1 text-sm font-medium text-tinta/70">
          Agranda todo junto: letras, botones y campos de carga.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {TAMANOS.map((id) => {
            const activo = tamano === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => cambiar(id)}
                aria-pressed={activo}
                className={`flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl p-3 transition-all active:scale-[0.98] ${
                  activo ? "clay-boton-primario text-white" : "clay-elevado text-tinta"
                }`}
              >
                <span
                  className="font-extrabold"
                  style={{ fontSize: `${18 * ESCALA_TAMANO[id]}px` }}
                >
                  Aa
                </span>
                <span className="text-xs font-bold">{ETIQUETA_TAMANO[id]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <p className="mt-8 text-xs leading-relaxed font-medium text-tinta/60">
        La preferencia se guarda en este dispositivo y se aplica de inmediato a toda
        la app: no hace falta recargar ni volver a entrar.
      </p>
    </div>
  );
}
