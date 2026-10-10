'use client'

import Link from 'next/link'
import {
  CalendarCheck,
  CalendarClock,
  CreditCard,
  Heart,
  Sparkles,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

const icons = [
  CalendarCheck,
  CalendarClock,
  CreditCard,
  Heart,
  Sparkles,
  BarChart3,
]

export function Categories() {
  const { t } = useLanguage()

  return (
    <section
      id="features"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-medium uppercase tracking-[0.22em] text-accent-foreground">
          {t.features.eyebrow}
        </span>
        <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
          {t.features.title}
        </h2>
        <p className="mt-4 text-muted-foreground text-pretty">
          {t.features.subtitle}
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.features.items.map((f, i) => {
          const Icon = icons[i]
          return (
            <Link
              key={f.title}
              href={f.href}
              className="group flex flex-col items-start rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-accent hover:shadow-md"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                {t.features.more}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
