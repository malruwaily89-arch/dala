'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Sparkles, CalendarCheck, TrendingUp } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

const icons = [Sparkles, CalendarCheck, TrendingUp]

export function HowItWorks() {
  const { t, lang, dir } = useLanguage()
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight

  return (
    <section id="how-it-works" className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium uppercase tracking-[0.22em] text-accent">
            {t.howItWorks.eyebrow}
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl text-balance">
            {t.howItWorks.title}
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {t.howItWorks.steps.map((s, i) => {
            const Icon = icons[i]
            return (
              <div key={s.title} className="relative flex flex-col items-start">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-6 font-serif text-sm tracking-widest text-accent">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-1 font-serif text-2xl font-semibold">
                  {s.title}
                </h3>
                <p className="mt-3 leading-relaxed text-primary-foreground/75">
                  {s.desc}
                </p>
              </div>
            )
          })}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/journey"
            className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {lang === 'en' ? 'See the full client journey with WhatsApp' : 'شاهدي رحلة العميلة الكاملة مع واتساب'}
            <Arrow className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
