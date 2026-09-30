export function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-[24px] border border-dashed border-brand-gold/30 bg-white/70 p-10 text-center text-sm text-foreground/55 backdrop-blur-sm">
      {text}
    </div>
  );
}

export function Banner({ children, success = false }: { children: React.ReactNode; success?: boolean }) {
  return (
    <p
      className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium shadow-sm ${
        success ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {children}
    </p>
  );
}
