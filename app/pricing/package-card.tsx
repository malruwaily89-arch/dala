"use client";

import Link from "next/link";
import { formatSar } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import { type Package } from "@/lib/pricing-data";

export function PackageCard({ p }: { p: Package }) {
  const { locale, t } = useLocale();
  const name = locale === "en" && p.nameEn ? p.nameEn : p.name;
  const tagline = locale === "en" && p.taglineEn ? p.taglineEn : p.tagline;
  const features = locale === "en" && p.featuresEn ? p.featuresEn : p.features;

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
        <span className="absolute -top-3.5 right-8 rounded-full bg-gradient-to-l from-[#c9a84c] to-[#d4af5c] px-4 py-1.5 text-xs font-bold text-[#1a0a2e] shadow rtl:right-8 ltr:left-8">
          {t.pricingPage.proBadge}
        </span>
      )}
      {!p.pro && p.popular && (
        <span className="absolute -top-3.5 right-8 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white shadow rtl:right-8 ltr:left-8">
          {t.pricingPage.popularBadge}
        </span>
      )}
      <h2 className="text-lg font-extrabold text-zinc-800">{name}</h2>
      <p className="mt-1 text-sm text-zinc-500">{tagline}</p>
      <p className="mt-5">
        <span className="text-4xl font-extrabold text-brand">{formatSar(p.price)}</span>
        <span className="text-zinc-400"> {t.pricingPage.perMonth}</span>
      </p>
      <p className="mt-1 text-xs text-zinc-400">{t.pricingPage.perYear.replace("{price}", formatSar(p.yearly))}</p>
      <ul className="mt-6 flex-1 space-y-3">
        {features.map((f) => (
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
        {t.pricingPage.ctaButton}
      </Link>
    </div>
  );
}
