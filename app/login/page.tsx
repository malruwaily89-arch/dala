"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { LocaleProvider, useLocale } from "@/lib/i18n/locale-context";
import { LanguageToggle } from "@/components/marketing/language-toggle";

function ErrorMessage() {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const error = searchParams.get("error");
  if (!error) return null;
  return (
    <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
      {error === "invalid" ? t.login.errorInvalid : t.login.errorMissing}
    </p>
  );
}

function LoginCard() {
  const { t, dir } = useLocale();

  return (
    <main dir={dir} className="relative flex flex-1 items-center justify-center overflow-hidden bg-background px-6 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-brand-gold/15 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm rounded-[32px] border border-brand-gold/20 bg-white p-8 shadow-2xl shadow-brand/10">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="دلال">
            <Image src="/dalal-logo.png" alt="دلال" width={140} height={90} className="h-auto w-28" priority />
          </Link>
          <LanguageToggle className="text-xs" />
        </div>

        <h1 className="mt-6 font-serif text-xl font-bold text-brand">{t.login.title}</h1>
        <p className="mt-1 text-sm text-brand/50">{t.login.subtitle}</p>

        <Suspense fallback={null}>
          <ErrorMessage />
        </Suspense>

        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-brand/80">
              {t.login.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              required
              className="w-full rounded-xl border border-brand/15 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              placeholder="you@salon.sa"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-brand/80">
              {t.login.password}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-xl border border-brand/15 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-brand py-3 font-bold text-white shadow-lg transition hover:bg-brand-light"
          >
            {t.login.submit}
          </button>
        </form>

        <Link href="/" className="mt-6 block text-center text-xs font-semibold text-brand/40 hover:text-brand">
          ← {t.login.backHome}
        </Link>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <LocaleProvider>
      <LoginCard />
    </LocaleProvider>
  );
}
