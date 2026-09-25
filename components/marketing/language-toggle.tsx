"use client";

import { useLocale } from "@/lib/i18n/locale-context";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, toggleLocale } = useLocale();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`rounded-full border border-[#c9a84c]/50 bg-white/10 px-4 py-2 text-sm font-semibold transition-all duration-300 hover:border-[#c9a84c] hover:bg-white/15 ${className}`}
      aria-label="Toggle language"
    >
      {locale === "ar" ? "English" : "العربية"}
    </button>
  );
}
