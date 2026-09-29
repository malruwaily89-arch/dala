'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'

export function Hero() {
  const { t } = useLanguage()
  const router = useRouter()
  const [email, setEmail] = useState('')

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-24">
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/15 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {t.hero.badge}
          </span>

          <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
            {t.hero.title}
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground text-pretty">
            {t.hero.subtitle}
          </p>

          {/* Trial capture */}
          <form
            className="mt-8 w-full max-w-xl rounded-2xl border border-border bg-card p-2 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault()
              router.push(`/signup?email=${encodeURIComponent(email.trim())}`)
            }}
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t.hero.emailPlaceholder}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  aria-label={t.hero.emailPlaceholder}
                  required
                />
              </div>
              <Button type="submit" size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
                {t.hero.startTrial}
              </Button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>{t.hero.trialNote}</span>
            <Link
              href="/b/demo-salon"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              {t.hero.bookDemo}{' '}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>

          <p className="mt-8 text-sm font-medium text-primary/80">
            {t.hero.trustLine}
          </p>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-border shadow-xl">
            <Image
              src="/hero-background.png"
              alt="واجهة حجز ومواعيد دلال"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -left-5 rtl:-right-5 rtl:left-auto hidden max-w-[15rem] rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur sm:block">
            <p className="font-serif text-sm font-semibold text-primary">
              {t.hero.liveTitle}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t.hero.liveDesc}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
