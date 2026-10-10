'use client'

import { Sparkles } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

export function Testimonials() {
  const { t } = useLanguage()

  return (
    <section className="bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium uppercase tracking-[0.22em] text-accent-foreground">
            {t.testimonials.eyebrow}
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
            {t.testimonials.title}
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
          <Sparkles className="mx-auto h-8 w-8 text-accent" aria-hidden />
          <p className="mt-4 text-lg font-medium text-foreground">
            {t.testimonials.emptyTitle}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.testimonials.emptyDesc}
          </p>
        </div>
      </div>
    </section>
  )
}
