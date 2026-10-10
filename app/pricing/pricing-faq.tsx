"use client";

import { useLocale } from "@/lib/i18n/locale-context";

export function PricingFaq() {
  const { t, dir } = useLocale();

  return (
    <section dir={dir} className="rounded-[36px] border border-brand-gold/20 bg-white/90 p-8 text-center md:p-10">
      <h2 className="font-serif text-xl font-bold text-brand">{t.pricingPage.faqTitle}</h2>
      <div className="mx-auto mt-6 grid max-w-3xl gap-6 text-start md:grid-cols-2">
        {t.pricingPage.faqs.map((faq) => (
          <div key={faq.q}>
            <h3 className="font-bold text-brand">{faq.q}</h3>
            <p className="mt-1 text-sm leading-6 text-brand/60">{faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
