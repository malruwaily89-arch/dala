"use client";

import { PricingTabs } from "./pricing-tabs";
import { PricingHero } from "./pricing-hero";
import { PricingFaq } from "./pricing-faq";
import { type Package } from "@/lib/pricing-data";
import { useLocale } from "@/lib/i18n/locale-context";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export function PricingPageShell({ regular, pro }: { regular: Package[]; pro: Package[] }) {
  const { dir } = useLocale();

  return (
    <div dir={dir}>
      <main className="flex-1 bg-background">
        <div className="relative">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />
            <div className="absolute top-40 -left-24 h-64 w-64 rounded-full bg-brand/5 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-6xl px-6 pb-12">
            <SiteHeader />
            <PricingHero />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-20">
          <PricingTabs regular={regular} pro={pro} />
          <PricingFaq />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
