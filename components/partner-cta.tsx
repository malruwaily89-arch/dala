'use client'

import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'

export function PartnerCta() {
  const { t } = useLanguage()
  const router = useRouter()
  const highlightedIndex = 1

  return (
    <section
      id="pricing"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-medium uppercase tracking-[0.22em] text-accent-foreground">
          {t.pricing.eyebrow}
        </span>
        <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
          {t.pricing.title}
        </h2>
        <p className="mt-4 text-muted-foreground text-pretty">
          {t.pricing.subtitle}
        </p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {t.pricing.plans.map((plan, i) => {
          const highlighted = i === highlightedIndex
          return (
            <div
              key={plan.name}
              className={
                highlighted
                  ? 'relative flex flex-col rounded-3xl border-2 border-primary bg-card p-8 shadow-lg'
                  : 'relative flex flex-col rounded-3xl border border-border bg-card p-8 shadow-sm'
              }
            >
              {highlighted && (
                <span className="absolute -top-3 left-8 rtl:right-8 rtl:left-auto rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                  {t.pricing.mostPopular}
                </span>
              )}
              <h3 className="font-serif text-2xl font-semibold text-foreground">
                {plan.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-serif text-4xl font-semibold text-primary">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t.pricing.perMonth}
                </span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-foreground/90"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                onClick={() => router.push('/pricing')}
                className={
                  highlighted
                    ? 'mt-8 bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'mt-8 border border-primary/30 bg-transparent text-primary hover:bg-secondary'
                }
              >
                {plan.cta}
              </Button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
