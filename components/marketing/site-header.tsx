"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/lib/i18n/locale-context";
import { LanguageToggle } from "./language-toggle";

export function SiteHeader() {
  const { t } = useLocale();

  return (
    <header className="relative z-10 flex items-center justify-between py-6">
      <Link href="/" aria-label="دلال">
        <Image src="/dalal-logo.png" alt="دلال" width={150} height={100} className="h-auto w-32 md:w-36" priority />
      </Link>
      <nav className="flex items-center gap-2 md:gap-3">
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
          href="/login"
          className="hidden rounded-full bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-brand-light sm:inline-block"
        >
          {t.hero.ctaPrimary}
        </Link>
        <LanguageToggle />
      </nav>
    </header>
  );
}
