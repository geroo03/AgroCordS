export default function Vacio({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-niebla/50 p-5 text-base leading-relaxed text-tinta/80">
      {children}
    </p>
  );
}
