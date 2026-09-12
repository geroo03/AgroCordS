export default function Vacio({ children }: { children: React.ReactNode }) {
  return (
    <p className="clay-elevado rounded-2xl p-6 text-base leading-relaxed font-medium text-tinta">
      {children}
    </p>
  );
}
