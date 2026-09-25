"use client";

import Link from "next/link";
import Image from "next/image";
import { formatSar } from "@/lib/utils";
import { REGULAR_PACKAGES, PRO_PACKAGES } from "@/lib/pricing-data";
import { useLocale } from "@/lib/i18n/locale-context";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

const STORY_IMAGES = ["/salon-1.png", "/salon-2.png", "/salon-3.png"];
const ALL_PACKAGES = [...REGULAR_PACKAGES, ...PRO_PACKAGES];

export function HomeShell() {
  const { t, dir, locale } = useLocale();

  return (
    <div dir={dir}>
      <main className="flex-1 overflow-hidden bg-background">
        {/* Hero */}
        <div className="relative">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />
            <div className="absolute top-40 -left-24 h-64 w-64 rounded-full bg-brand/5 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6">
            <SiteHeader />

            <section className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
              <div className="text-center md:text-start">
                <span className="mx-auto inline-block rounded-full bg-brand-gold/10 px-4 py-1.5 text-xs font-bold text-brand-gold ring-1 ring-brand-gold/30 md:mx-0">
                  {t.hero.badge}
                </span>
                <h1 className="mx-auto mt-5 max-w-xl font-serif text-4xl font-bold leading-snug text-brand md:mx-0 md:text-5xl md:leading-snug">
                  {t.hero.titleLine1}
                  <br />
                  {t.hero.titleLine2}
                </h1>
                <p className="mx-auto mt-6 max-w-lg text-lg leading-8 text-brand/70 md:mx-0">{t.hero.subtitle}</p>
                <div className="mt-9 flex flex-wrap items-center justify-center gap-4 md:justify-start">
                  <Link
                    href="/login"
                    className="rounded-full bg-brand px-8 py-3.5 font-bold text-white shadow-lg shadow-brand/20 transition-all duration-300 hover:scale-[1.02] hover:bg-brand-light"
                  >
                    {t.hero.ctaPrimary}
                  </Link>
                  <Link
                    href="/b/demo-salon"
                    className="rounded-full border border-brand/20 bg-white px-8 py-3.5 font-bold text-brand shadow-sm transition-all duration-300 hover:border-brand-gold"
                  >
                    {t.hero.ctaSecondary}
                  </Link>
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-brand/60 md:justify-start">
                  <span>{t.hero.trialNote}</span>
                  <span className="hidden h-1 w-1 rounded-full bg-brand/30 sm:inline-block" />
                  <span>⭐ {t.hero.rating}</span>
                  <span className="hidden h-1 w-1 rounded-full bg-brand/30 sm:inline-block" />
                  <span className="font-bold text-brand-gold">{t.hero.salonsCount}</span>
                  <span>{t.hero.salonsCountLabel}</span>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-md md:mx-0 md:max-w-none">
                <div className="overflow-hidden rounded-[36px] border-4 border-white shadow-2xl shadow-brand/15">
                  <Image
                    src="/hero-salon.png"
                    alt="Elegant luxury beauty salon interior"
                    width={1312}
                    height={1199}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>
                <div aria-hidden className="absolute -bottom-6 -start-6 h-24 w-24 rounded-full bg-brand-gold/20 blur-2xl" />
              </div>
            </section>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6">
          {/* Features */}
          <section className="py-16 md:py-20">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">{t.features.eyebrow}</span>
              <h2 className="mt-2 font-serif text-2xl font-bold text-brand md:text-3xl">{t.features.title}</h2>
              <p className="mx-auto mt-3 max-w-xl text-brand/60">{t.features.subtitle}</p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {t.features.items.map((f) => (
                <div
                  key={f.title}
                  className="rounded-[28px] border border-brand-gold/15 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-brand-gold/15"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/10 text-2xl">
                    {f.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold text-brand">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-brand/60">{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Steps */}
          <section className="py-12 md:py-16">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">{t.steps.eyebrow}</span>
              <h2 className="mt-2 font-serif text-2xl font-bold text-brand md:text-3xl">{t.steps.title}</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {t.steps.items.map((s) => (
                <div key={s.n} className="rounded-[28px] border border-brand-gold/15 bg-white p-7 text-center shadow-sm">
                  <span className="font-serif text-3xl font-bold text-brand-gold/60">{s.n}</span>
                  <h3 className="mt-3 text-lg font-extrabold text-brand">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-brand/60">{s.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Success stories */}
          <section className="py-12 md:py-16">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">{t.stories.eyebrow}</span>
              <h2 className="mt-2 font-serif text-2xl font-bold text-brand md:text-3xl">{t.stories.title}</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {t.stories.items.map((s, i) => (
                <div
                  key={s.name}
                  className="overflow-hidden rounded-[28px] border border-brand-gold/15 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative h-36 w-full">
                    <Image src={STORY_IMAGES[i % STORY_IMAGES.length]} alt={s.name} fill className="object-cover" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between text-xs text-brand/50">
                      <span>{s.city}</span>
                      <span className="font-bold text-brand-gold">★ {s.rating}</span>
                    </div>
                    <h3 className="mt-2 text-base font-extrabold text-brand">{s.name}</h3>
                    <p className="mt-1 text-sm text-brand/50">{s.tag}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-brand/40">
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
              <h2 className="mt-2 font-serif text-2xl font-bold text-brand md:text-3xl">{t.testimonials.title}</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {t.testimonials.items.map((tst) => (
                <div key={tst.name} className="flex flex-col rounded-[28px] border border-brand-gold/15 bg-white p-7 shadow-sm">
                  <p className="flex-1 text-sm leading-7 text-brand/70">&ldquo;{tst.quote}&rdquo;</p>
                  <div className="mt-5 border-t border-brand-gold/15 pt-4">
                    <p className="text-sm font-extrabold text-brand">{tst.name}</p>
                    <p className="text-xs text-brand/50">{tst.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pricing preview — all 6 packages */}
          <section className="py-12 md:py-16">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">{t.pricingPreview.eyebrow}</span>
              <h2 className="mt-2 font-serif text-2xl font-bold text-brand md:text-3xl">{t.pricingPreview.title}</h2>
              <p className="mt-3 text-brand/60">{t.pricingPreview.subtitle}</p>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_PACKAGES.map((p) => (
                <div
                  key={p.name}
                  className={`relative flex flex-col rounded-[28px] border-2 bg-white p-7 text-center transition-all duration-300 hover:-translate-y-1 ${
                    p.pro || p.popular ? "border-brand-gold shadow-lg shadow-brand-gold/20" : "border-brand-gold/15 shadow-sm"
                  }`}
                >
                  {p.pro && (
                    <span className="absolute -top-3.5 right-1/2 translate-x-1/2 rounded-full bg-brand-gold px-4 py-1 text-xs font-bold text-brand shadow">
                      {t.pricingPage.proBadge}
                    </span>
                  )}
                  {!p.pro && p.popular && (
                    <span className="absolute -top-3.5 right-1/2 translate-x-1/2 rounded-full bg-brand px-4 py-1 text-xs font-bold text-white shadow">
                      {t.pricingPreview.mostPopular}
                    </span>
                  )}
                  <h3 className="text-lg font-extrabold text-brand">{locale === "en" && p.nameEn ? p.nameEn : p.name}</h3>
                  <p className="mt-1 text-xs text-brand/50">{locale === "en" && p.taglineEn ? p.taglineEn : p.tagline}</p>
                  <p className="mt-4">
                    <span className="text-3xl font-extrabold text-brand">{formatSar(p.price)}</span>
                    <span className="text-brand/40"> {t.pricingPreview.perMonth}</span>
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
