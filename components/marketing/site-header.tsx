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
          className="hidden rounded-full border border-[#c9a84c]/50 bg-white/10 px-4 py-2 text-sm font-semibold transition-all duration-300 hover:border-[#c9a84c] hover:bg-white/15 sm:inline-block"
        >
          {t.nav.pricing}
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-[#c9a84c]/50 bg-white/10 px-4 py-2 text-sm font-semibold transition-all duration-300 hover:border-[#c9a84c] hover:bg-white/15"
        >
          {t.nav.login}
        </Link>
        <LanguageToggle />
      </nav>
    </header>
  );
}
