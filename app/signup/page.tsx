"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { signupAction } from "@/app/actions/auth";
import { LocaleProvider, useLocale } from "@/lib/i18n/locale-context";
import { LanguageToggle } from "@/components/marketing/language-toggle";

function ErrorMessage() {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const error = searchParams.get("error");
  if (!error) return null;

  const message =
    error === "missing"
      ? t.signup.errorMissing
      : error === "password"
        ? t.signup.errorPassword
        : error === "exists"
          ? t.signup.errorExists
          : t.signup.errorGeneric;

  return (
    <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p>
  );
}

function SignupCard() {
  const { t, dir } = useLocale();
  const searchParams = useSearchParams();
  const emailFromHero = searchParams.get("email") ?? "";

  return (
    <main dir={dir} className="relative flex flex-1 items-center justify-center overflow-hidden bg-background px-6 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-brand-gold/15 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm rounded-[32px] border border-brand-gold/20 bg-white p-8 shadow-2xl shadow-brand/10">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="دلال">
            <Image src="/dala-logo-option-a.png" alt="دلال" width={140} height={90} className="h-auto w-28" priority />
          </Link>
          <LanguageToggle className="text-xs" />
        </div>

        <h1 className="mt-6 font-serif text-xl font-bold text-brand">{t.signup.title}</h1>
        <p className="mt-1 text-sm text-brand/50">{t.signup.subtitle}</p>

        <Suspense fallback={null}>
          <ErrorMessage />
        </Suspense>

        <form action={signupAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-semibold text-brand/80">
              {t.signup.salonName}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-xl border border-brand/15 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              placeholder="صالون لمسة"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-brand/80">
              {t.signup.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              defaultValue={emailFromHero}
              required
              className="w-full rounded-xl border border-brand/15 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              placeholder="you@salon.sa"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-brand/80">
              {t.signup.password}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-xl border border-brand/15 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-brand/80">
              {t.signup.phone}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              dir="ltr"
              required
              className="w-full rounded-xl border border-brand/15 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              placeholder="05xxxxxxxx"
            />
          </div>
          <div>
            <label htmlFor="city" className="mb-1 block text-sm font-semibold text-brand/80">
              {t.signup.city}
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              className="w-full rounded-xl border border-brand/15 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              placeholder="الرياض"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-brand py-3 font-bold text-white shadow-lg transition hover:bg-brand-light"
          >
            {t.signup.submit}
          </button>
        </form>

        <Link href="/login" className="mt-6 block text-center text-xs font-semibold text-brand/50 hover:text-brand">
          {t.signup.loginLink}
        </Link>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <LocaleProvider>
      <Suspense fallback={null}>
        <SignupCard />
      </Suspense>
    </LocaleProvider>
  );
}
