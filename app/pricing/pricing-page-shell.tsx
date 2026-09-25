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
      <main className="flex-1 bg-[#faf5eb]">
        <div className="bg-gradient-to-b from-[#1a0a2e] via-[#2d1b4e] to-[#4a2075]">
          <div className="mx-auto max-w-6xl px-6 pb-12">
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
