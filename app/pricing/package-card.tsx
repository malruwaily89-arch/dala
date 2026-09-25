import Link from "next/link";
import { formatSar } from "@/lib/utils";

export type Package = {
  name: string;
  price: number;
  yearly: number;
  tagline: string;
  popular?: boolean;
  pro?: boolean;
  features: string[];
};

export function PackageCard({ p }: { p: Package }) {
  return (
    <div
      className={`relative flex flex-col rounded-[36px] border-2 bg-white p-8 ${
        p.pro
          ? "border-[#c9a84c] shadow-xl shadow-[#2d1b4e]/10"
          : p.popular
            ? "border-[#c9a84c] shadow-xl shadow-[#2d1b4e]/10"
            : "border-[#c9a84c]/20 shadow-md shadow-[#2d1b4e]/10"
      }`}
    >
      {p.pro && (
        <span className="absolute -top-3.5 right-8 rounded-full bg-gradient-to-l from-[#c9a84c] to-[#d4af5c] px-4 py-1.5 text-xs font-bold text-[#1a0a2e] shadow">
          برو ✨
        </span>
      )}
      {!p.pro && p.popular && (
        <span className="absolute -top-3.5 right-8 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white shadow">
          الأكثر طلباً 🌸
        </span>
      )}
      <h2 className="text-lg font-extrabold text-zinc-800">{p.name}</h2>
      <p className="mt-1 text-sm text-zinc-500">{p.tagline}</p>
      <p className="mt-5">
        <span className="text-4xl font-extrabold text-brand">
          {formatSar(p.price)}
        </span>
        <span className="text-zinc-400"> / شهرياً</span>
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        أو {formatSar(p.yearly)} سنوياً (شهران مجاناً)
      </p>
      <ul className="mt-6 flex-1 space-y-3">
        {p.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm leading-6 text-zinc-700">
            <span className={p.pro ? "text-[#c9a84c]" : "text-brand"}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/login"
        className={`mt-8 rounded-full py-3 text-center font-bold transition hover:opacity-90 ${
          p.pro
            ? "bg-[#c9a84c] text-[#1a0a2e] shadow-lg"
            : p.popular
              ? "bg-brand text-white shadow-lg"
              : "bg-[#f5eddb] text-brand"
        }`}
      >
        ابدئي تجربتك المجانية
      </Link>
    </div>
  );
}
