"use client";

import Link from "next/link";
import { formatSar } from "@/lib/utils";
import { REGULAR_PACKAGES } from "@/lib/pricing-data";
import { useLocale } from "@/lib/i18n/locale-context";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export function HomeShell() {
  const { t, dir, locale } = useLocale();

  return (
    <div dir={dir}>
      <main className="flex-1 overflow-hidden bg-[#faf5eb]">
        {/* Hero */}
        <div className="relative bg-gradient-to-b from-[#1a0a2e] via-[#2d1b4e] to-[#4a2075] text-white">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-[#c9a84c]/25 blur-3xl" />
            <div className="absolute top-40 -left-24 h-64 w-64 rounded-full bg-[#5c2d91]/50 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-5xl px-6">
            <SiteHeader />

            <section className="py-16 text-center md:py-24">
              <span className="mx-auto mb-5 inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-[#d4af5c] shadow-sm ring-1 ring-[#c9a84c]/40">
                {t.hero.badge}
              </span>
              <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-snug md:text-5xl md:leading-snug">
                {t.hero.titleLine1}
                <br />
                {t.hero.titleLine2}
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/80">{t.hero.subtitle}</p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="rounded-full bg-[#c9a84c] px-8 py-3.5 font-bold text-[#2d1b4e] shadow-lg shadow-black/20 transition-all duration-300 hover:scale-[1.02] hover:bg-[#d4af5c]"
                >
                  {t.hero.ctaPrimary}
                </Link>
                <Link
                  href="/b/demo-salon"
                  className="rounded-full border border-white/30 bg-white/10 px-8 py-3.5 font-bold transition-all duration-300 hover:border-[#c9a84c] hover:shadow-sm"
                >
                  {t.hero.ctaSecondary}
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
                <span>{t.hero.trialNote}</span>
                <span className="hidden h-1 w-1 rounded-full bg-white/40 sm:inline-block" />
                <span>⭐ {t.hero.rating}</span>
                <span className="hidden h-1 w-1 rounded-full bg-white/40 sm:inline-block" />
                <span className="font-bold text-[#d4af5c]">{t.hero.salonsCount}</span>
                <span>{t.hero.salonsCountLabel}</span>
              </div>
            </section>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-6">
          {/* Features */}
          <section className="py-16 md:py-20">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">{t.features.eyebrow}</span>
              <h2 className="mt-2 text-2xl font-extrabold text-[#2d1b4e] md:text-3xl">{t.features.title}</h2>
              <p className="mx-auto mt-3 max-w-xl text-zinc-500">{t.features.subtitle}</p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {t.features.items.map((f) => (
                <div
                  key={f.title}
                  className="rounded-[28px] border border-[#c9a84c]/15 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-[#c9a84c]/20"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5eddb] text-2xl">
                    {f.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold text-zinc-800">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Steps */}
          <section className="py-12 md:py-16">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">{t.steps.eyebrow}</span>
              <h2 className="mt-2 text-2xl font-extrabold text-[#2d1b4e] md:text-3xl">{t.steps.title}</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {t.steps.items.map((s) => (
                <div key={s.n} className="rounded-[28px] border border-[#c9a84c]/15 bg-white p-7 text-center shadow-sm">
                  <span className="text-3xl font-extrabold text-[#c9a84c]/60">{s.n}</span>
                  <h3 className="mt-3 text-lg font-extrabold text-zinc-800">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{s.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Success stories */}
          <section className="py-12 md:py-16">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">{t.stories.eyebrow}</span>
              <h2 className="mt-2 text-2xl font-extrabold text-[#2d1b4e] md:text-3xl">{t.stories.title}</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {t.stories.items.map((s) => (
                <div
                  key={s.name}
                  className="overflow-hidden rounded-[28px] border border-[#c9a84c]/15 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#2d1b4e] via-[#4a2075] to-[#c9a84c]/60 text-4xl font-extrabold text-white">
                    {s.initial}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{s.city}</span>
                      <span className="font-bold text-[#c9a84c]">★ {s.rating}</span>
                    </div>
                    <h3 className="mt-2 text-base font-extrabold text-zinc-800">{s.name}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{s.tag}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                      <span>{s.reviews}</span>
                      <span>{s.bookings}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-12 md:py-16">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">{t.testimonials.eyebrow}</span>
              <h2 className="mt-2 text-2xl font-extrabold text-[#2d1b4e] md:text-3xl">{t.testimonials.title}</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {t.testimonials.items.map((tst) => (
                <div key={tst.name} className="flex flex-col rounded-[28px] border border-[#c9a84c]/15 bg-white p-7 shadow-sm">
                  <p className="flex-1 text-sm leading-7 text-zinc-700">&ldquo;{tst.quote}&rdquo;</p>
                  <div className="mt-5 border-t border-[#c9a84c]/15 pt-4">
                    <p className="text-sm font-extrabold text-zinc-800">{tst.name}</p>
                    <p className="text-xs text-zinc-500">{tst.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pricing preview */}
          <section className="py-12 md:py-16">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">{t.pricingPreview.eyebrow}</span>
              <h2 className="mt-2 text-2xl font-extrabold text-[#2d1b4e] md:text-3xl">{t.pricingPreview.title}</h2>
              <p className="mt-3 text-zinc-500">{t.pricingPreview.subtitle}</p>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {REGULAR_PACKAGES.map((p) => (
                <div
                  key={p.name}
                  className={`relative flex flex-col rounded-[28px] border-2 bg-white p-7 text-center transition-all duration-300 hover:-translate-y-1 ${
                    p.popular ? "border-brand shadow-lg shadow-[#c9a84c]/25" : "border-[#c9a84c]/15 shadow-sm"
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-3.5 right-1/2 translate-x-1/2 rounded-full bg-brand px-4 py-1 text-xs font-bold text-white shadow">
                      {t.pricingPreview.mostPopular}
                    </span>
                  )}
                  <h3 className="text-lg font-extrabold text-zinc-800">{locale === "en" && p.nameEn ? p.nameEn : p.name}</h3>
                  <p className="mt-1 text-xs text-zinc-500">{locale === "en" && p.taglineEn ? p.taglineEn : p.tagline}</p>
                  <p className="mt-4">
                    <span className="text-3xl font-extrabold text-brand">{formatSar(p.price)}</span>
                    <span className="text-zinc-400"> {t.pricingPreview.perMonth}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/pricing" className="text-sm font-bold text-brand underline-offset-4 hover:underline">
                {t.pricingPreview.viewAll} ←
              </Link>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
