"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLanguage } from "@/components/language-provider";
import { FEATURES } from "./feature-data";

export default function FeaturesIndexPage() {
  const { t, lang } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute top-40 -left-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
            <span className="text-sm font-medium uppercase tracking-[0.22em] text-accent-foreground">
              {t.features.eyebrow}
            </span>
            <h1 className="mx-auto mt-3 max-w-3xl font-serif text-3xl font-semibold text-foreground text-balance sm:text-4xl lg:text-5xl">
              {t.features.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
              {t.features.subtitle}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const c = lang === "en" ? f.en : f.ar;
              const Icon = f.icon;
              return (
                <Link
                  key={f.slug}
                  href={`/features/${f.slug}`}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-accent hover:shadow-md"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h2 className="mt-4 font-serif text-lg font-semibold text-foreground">
                    {c.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {c.subtitle}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    {t.features.more}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/signup"
              className="inline-block rounded-full bg-primary px-10 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02]"
            >
              {t.header.startTrial}
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">{t.hero.trialNote}</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
