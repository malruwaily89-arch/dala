"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="border-t border-brand/10 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 text-sm text-brand/65 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" aria-label="دلال — الصفحة الرئيسية">
          <BrandLogo compact />
        </Link>
        <p>{t.footer.rights.replace("{year}", String(new Date().getFullYear()))} — {t.footer.tagline}</p>
        <nav className="flex gap-4" aria-label="Footer">
          <Link href="/features" className="hover:text-brand">{t.nav.features}</Link>
          <Link href="/pricing" className="hover:text-brand">{t.nav.pricing}</Link>
          <Link href="/login" className="hover:text-brand">{t.nav.login}</Link>
        </nav>
      </div>
    </footer>
  );
}
