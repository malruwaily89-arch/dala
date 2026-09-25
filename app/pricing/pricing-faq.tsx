"use client";

import { useLocale } from "@/lib/i18n/locale-context";

export function PricingFaq() {
  const { t, dir } = useLocale();

  return (
    <section dir={dir} className="rounded-[36px] border border-[#c9a84c]/25 bg-white/90 p-8 text-center md:p-10">
      <h2 className="text-xl font-extrabold text-zinc-800">{t.pricingPage.faqTitle}</h2>
      <div className="mx-auto mt-6 grid max-w-3xl gap-6 text-start md:grid-cols-2">
        {t.pricingPage.faqs.map((faq) => (
          <div key={faq.q}>
            <h3 className="font-bold text-zinc-800">{faq.q}</h3>
            <p className="mt-1 text-sm leading-6 text-zinc-600">{faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
