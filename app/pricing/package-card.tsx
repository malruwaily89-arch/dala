"use client";

import Link from "next/link";
import { formatSar } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import { type Package } from "@/lib/pricing-data";
import { BILLING_PERIODS } from "./billing-period";

export function PackageCard({ p, months = 1 }: { p: Package; months?: number }) {
  const { locale, t } = useLocale();
  const name = locale === "en" && p.nameEn ? p.nameEn : p.name;
  const tagline = locale === "en" && p.taglineEn ? p.taglineEn : p.tagline;
  const features = locale === "en" && p.featuresEn ? p.featuresEn : p.features;

  const period = BILLING_PERIODS.find((b) => b.months === months);
  const discount = period?.discount ?? 0;
  const listTotal = p.price * months;
  const total = Math.round(listTotal * (100 - discount) / 100);
  const effectiveMonthly = Math.round(total / months);
  const periodLabel = period?.labelKey ?? "period1";

  return (
    <div
      className={`relative flex flex-col rounded-[36px] border-2 bg-white p-8 transition-all duration-300 hover:-translate-y-1 ${
        p.pro
          ? "border-brand-gold shadow-xl shadow-brand/10 hover:shadow-2xl hover:shadow-brand/15"
          : p.popular
            ? "border-brand-gold shadow-xl shadow-brand/10 hover:shadow-2xl hover:shadow-brand/15"
            : "border-brand-gold/20 shadow-md shadow-brand/5 hover:border-brand-gold/40 hover:shadow-lg hover:shadow-brand/10"
      }`}
    >
      {p.pro && (
        <span className="absolute -top-3.5 right-8 rounded-full bg-gradient-to-l from-brand-gold to-[#d8b876] px-4 py-1.5 text-xs font-bold text-brand shadow rtl:right-8 ltr:left-8">
          {t.pricingPage.proBadge}
        </span>
      )}
      {!p.pro && p.popular && (
        <span className="absolute -top-3.5 right-8 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white shadow rtl:right-8 ltr:left-8">
          {t.pricingPage.popularBadge}
        </span>
      )}
      <h2 className="font-serif text-lg font-bold text-brand">{name}</h2>
      <p className="mt-1 text-sm text-brand/50">{tagline}</p>
      <p className="mt-5">
        <span className="text-4xl font-extrabold text-brand">
          {formatSar(months === 1 ? p.price : total)}
        </span>
        <span className="text-brand/40">
          {" "}
          {months === 1
            ? t.pricingPage.perMonth
            : t.pricingPage.periodPer.replace("{period}", t.pricingPage[periodLabel])}
        </span>
      </p>
      {months === 1 ? (
        <p className="mt-1 text-xs text-brand/40">{t.pricingPage.perYear.replace("{price}", formatSar(p.yearly))}</p>
      ) : (
        <>
          <p className="mt-2">
            <span className="inline-block rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-[11px] font-bold text-brand-gold">
              {t.pricingPage.periodDiscount.replace("{percent}", String(discount))}
            </span>
          </p>
          <p className="mt-1 text-xs text-brand/40">
            <span className="line-through">{t.pricingPage.periodWas.replace("{price}", formatSar(listTotal))}</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-brand/60">
            {t.pricingPage.periodEquivalent.replace("{price}", formatSar(effectiveMonthly))}
          </p>
        </>
      )}
      <ul className="mt-6 flex-1 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm leading-6 text-brand/70">
            <span className={p.pro ? "text-brand-gold" : "text-brand"}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/signup"
        className={`mt-8 rounded-full py-3 text-center font-bold transition hover:opacity-90 ${
          p.pro
            ? "bg-brand-gold text-brand shadow-lg"
            : p.popular
              ? "bg-brand text-white shadow-lg"
              : "bg-brand-gold/10 text-brand"
        }`}
      >
        {t.pricingPage.ctaButton}
      </Link>
    </div>
  );
}
