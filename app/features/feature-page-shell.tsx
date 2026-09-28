"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLanguage } from "@/components/language-provider";
import { FeatureMock } from "./feature-mocks";
import { FEATURES_BY_SLUG, type FeatureSlug } from "./feature-data";

export function FeaturePageShell({ slug }: { slug: FeatureSlug }) {
  const { t, lang } = useLanguage();
  const feature = FEATURES_BY_SLUG[slug];
  const c = lang === "en" ? feature.en : feature.ar;
  const Icon = feature.icon;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute top-40 -left-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary shadow-sm mx-auto">
              <Icon className="h-8 w-8" />
            </span>
            <span className="mt-6 inline-block text-sm font-medium uppercase tracking-[0.22em] text-accent-foreground">
              {c.badge}
            </span>
            <h1 className="mx-auto mt-3 max-w-3xl font-serif text-3xl font-semibold text-foreground text-balance sm:text-4xl lg:text-5xl">
              {c.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
              {c.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02]"
              >
                {c.ctaButton}
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border border-primary/30 bg-transparent px-8 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
              >
                {c.seePricing}
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl text-balance">
              {c.howTitle}
            </h2>
            <p className="mt-3 text-muted-foreground text-pretty">{c.howIntro}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {c.steps.map((s, i) => (
              <div
                key={s.title}
                className="relative rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <span className="font-serif text-sm tracking-widest text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-serif text-lg font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Mock UI */}
        <section className="border-y border-border bg-card/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl text-balance">
                {c.mockTitle}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">{c.mockNote}</p>
            </div>
            <div className="mt-10">
              <FeatureMock slug={slug} />
            </div>
          </div>
        </section>

        {/* Examples */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl text-balance">
              {c.examplesTitle}
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {c.examples.map((e) => (
              <div
                key={e.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-accent hover:shadow-md"
              >
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  {e.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {e.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl text-balance">
                {c.benefitsTitle}
              </h2>
            </div>
            <ul className="mx-auto mt-8 grid max-w-4xl gap-x-10 gap-y-4 sm:grid-cols-2">
              {c.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
            <h2 className="mx-auto max-w-2xl font-serif text-3xl font-semibold text-balance sm:text-4xl">
              {c.ctaTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              {c.ctaBody}
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground shadow-lg transition-all hover:scale-[1.02]"
            >
              {c.ctaButton}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <p className="mt-4 text-xs text-primary-foreground/70">
              {t.hero.trialNote}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
