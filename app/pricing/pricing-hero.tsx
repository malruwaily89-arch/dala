"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

export function PricingHero() {
  const { t, dir } = useLocale();

  return (
    <section dir={dir} className="py-10 text-center md:py-14">
      <Link
        href="/pricing/proposal"
        className="mx-auto mb-6 inline-block rounded-full border border-brand/20 bg-white px-4 py-2 text-sm font-semibold text-brand shadow-sm hover:border-brand-gold"
      >
        {t.nav.largeProjects}
      </Link>
      <h1 className="mx-auto max-w-2xl font-serif text-4xl font-bold leading-snug text-brand md:text-5xl md:leading-snug">
        {t.pricingPage.titleLine1}
        <br />
        {t.pricingPage.titleLine2}
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-brand/70">{t.pricingPage.subtitle}</p>
    </section>
  );
}
