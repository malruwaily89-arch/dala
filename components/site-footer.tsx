'use client'

import Link from 'next/link'
import { Logo } from '@/components/logo'
import { useLanguage } from '@/components/language-provider'

export function SiteFooter() {
  const { t } = useLanguage()

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t.footer.description}
            </p>
          </div>

          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-foreground">
              {t.footer.columns[0]?.heading}
            </h3>
            <ul className="mt-4 space-y-3">
              <li><Link href="/features" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t.footer.columns[0]?.links[0]}</Link></li>
              <li><Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t.footer.columns[0]?.links[1]}</Link></li>
              <li><Link href="/signup" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t.footer.columns[0]?.links[2]}</Link></li>
              <li><Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t.footer.columns[0]?.links[3]}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-foreground">
              {t.footer.columns[2]?.heading}
            </h3>
            <ul className="mt-4 space-y-3">
              <li><Link href="/features" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t.footer.columns[2]?.links[0]}</Link></li>
              <li><Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t.footer.columns[2]?.links[1]}</Link></li>
              <li><Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t.footer.columns[2]?.links[2]}</Link></li>
              <li><Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">{t.footer.columns[2]?.links[3]}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Dalal · دلال. {t.footer.rights}
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>{t.footer.privacy}</span>
            <span>{t.footer.terms}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
