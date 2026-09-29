"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { LanguageToggle } from "./language-toggle";
import { BrandLogo } from "@/components/brand-logo";

export function SiteHeader() {
  const { t } = useLocale();

  return (
    <header className="relative z-10 flex items-center justify-between border-b border-brand/10 py-5">
      <Link href="/" aria-label="دلال — الصفحة الرئيسية">
        <BrandLogo />
      </Link>
      <nav className="flex items-center gap-2 md:gap-3">
        <Link
          href="/features"
          className="hidden rounded-full border border-brand/20 px-4 py-2 text-sm font-semibold text-brand transition-all duration-300 hover:border-brand-gold hover:bg-brand-gold/10 md:inline-block"
        >
          {t.nav.features}
        </Link>
        <Link
          href="/pricing"
          className="hidden rounded-full border border-brand/20 px-4 py-2 text-sm font-semibold text-brand transition-all duration-300 hover:border-brand-gold hover:bg-brand-gold/10 sm:inline-block"
        >
          {t.nav.pricing}
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-brand/20 px-4 py-2 text-sm font-semibold text-brand transition-all duration-300 hover:border-brand-gold hover:bg-brand-gold/10"
        >
          {t.nav.login}
        </Link>
        <Link
          href="/signup"
          className="hidden rounded-full bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-brand-light sm:inline-block"
        >
          {t.hero.ctaPrimary}
        </Link>
        <LanguageToggle />
      </nav>
    </header>
  );
}
