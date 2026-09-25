"use client";

import { useLocale } from "@/lib/i18n/locale-context";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, toggleLocale } = useLocale();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`rounded-full border border-brand/20 px-4 py-2 text-sm font-semibold text-brand transition-all duration-300 hover:border-brand-gold hover:bg-brand-gold/10 ${className}`}
      aria-label="Toggle language"
    >
      {locale === "ar" ? "English" : "العربية"}
    </button>
  );
}
