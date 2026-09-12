/** Esqueleto con la forma del veredicto y la línea de tiempo, no un spinner. */
export default function Cargando() {
  return (
    <div aria-busy="true" className="space-y-8 py-8">
      <div className="space-y-3">
        <div className="clay-hundido h-14 w-2/3 animate-pulse rounded-2xl" />
        <div className="clay-hundido h-6 w-1/2 animate-pulse rounded-xl" />
      </div>
      {[0, 1, 2].map((dia) => (
        <div key={dia} className="space-y-2">
          <div className="clay-hundido h-4 w-16 animate-pulse rounded-lg" />
          <div className="flex gap-[2px]">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="clay-hundido h-8 flex-1 animate-pulse rounded-[4px]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
