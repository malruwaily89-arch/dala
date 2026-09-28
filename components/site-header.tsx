'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { useLanguage } from '@/components/language-provider'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { t, lang, toggleLang } = useLanguage()

  const navLinks = [
    { label: t.header.nav.features, href: '/features' },
    { label: t.header.nav.howItWorks, href: '/#how-it-works' },
    { label: t.header.nav.salons, href: '/#salons' },
    { label: t.header.nav.pricing, href: '/pricing' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" aria-label="Dalal home">
          <Logo />
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/75 transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            onClick={toggleLang}
            className="gap-1.5 text-foreground/80 hover:text-primary"
            aria-label={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
          >
            <Globe className="h-4 w-4" />
            {lang === 'en' ? 'العربية' : 'English'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push('/login')}
            className="text-foreground/80 hover:text-primary"
          >
            {t.header.signIn}
          </Button>
          <Button
            onClick={() => router.push('/signup')}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {t.header.startTrial}
          </Button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLang}
            className="gap-1.5 text-foreground/80 hover:text-primary"
            aria-label={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
          >
            <Globe className="h-4 w-4" />
            {lang === 'en' ? 'ع' : 'EN'}
          </Button>
          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-primary"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t.header.closeMenu : t.header.openMenu}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav
            className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4"
            aria-label="Mobile"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-secondary hover:text-primary"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Button variant="outline" onClick={() => router.push('/login')}>
                {t.header.signIn}
              </Button>
              <Button
                onClick={() => router.push('/signup')}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {t.header.startTrial}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
