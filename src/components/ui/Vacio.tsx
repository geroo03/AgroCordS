export default function Vacio({ children }: { children: React.ReactNode }) {
  return (
    <p className="shadow-sunken rounded-xl bg-[#f2f3ff] p-5 text-[18px] leading-relaxed text-tinta/80">
      {children}
    </p>
  );
}
