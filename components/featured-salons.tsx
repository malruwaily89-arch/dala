'use client'

import { Sparkles } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

export function FeaturedSalons() {
  const { t } = useLanguage()

  return (
    <section id="salons" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <span className="text-sm font-medium uppercase tracking-[0.22em] text-accent-foreground">
            {t.salons.eyebrow}
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
            {t.salons.title}
          </h2>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 px-6 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mt-5 font-serif text-xl font-semibold text-foreground">
          {t.salons.emptyTitle}
        </h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {t.salons.emptyDesc}
        </p>
      </div>
    </section>
  )
}
