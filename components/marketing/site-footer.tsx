"use client";

import { useLocale } from "@/lib/i18n/locale-context";

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="border-t border-[#c9a84c]/25 bg-[#1a0a2e] py-8 text-center text-sm text-white/70">
      {t.footer.rights.replace("{year}", String(new Date().getFullYear()))} — {t.footer.tagline}
    </footer>
  );
}
