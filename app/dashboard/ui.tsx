export function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
      {text}
    </div>
  );
}

export function Banner({ children, success = false }: { children: React.ReactNode; success?: boolean }) {
  return (
    <p
      className={`mt-4 rounded-lg px-3 py-2 text-sm ${
        success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {children}
    </p>
  );
}
