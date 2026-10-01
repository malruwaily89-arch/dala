"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { ConfirmMock, ReminderMock, FollowUpMock } from "@/app/journey/journey-shell";

const copy = {
  ar: {
    eyebrow: "جوهر دلال",
    title: "من الحجز إلى المتابعة — تلقائياً بالكامل عبر واتساب",
    lede: "هذا ما يجلب لكِ العميلات ويقنع كل مالكة صالون: تأكيد، تذكير، ومتابعة تُرسَل من رقم واتساب الصالون نفسه — بدون ما تكتب موظفة كلمة واحدة.",
    cta: "شاهدي الرحلة الكاملة خطوة بخطوة",
  },
  en: {
    eyebrow: "The heart of Dala",
    title: "From booking to follow-up — fully automatic on WhatsApp",
    lede: "This is what brings clients in and convinces every salon owner: confirmation, reminder, and follow-up sent from the salon's own WhatsApp number — without a single staff member typing a word.",
    cta: "See the full step-by-step journey",
  },
};

export function JourneyTeaser() {
  const { lang, dir } = useLanguage();
  const c = lang === "en" ? copy.en : copy.ar;
  const isAr = lang !== "en";
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden border-y border-border bg-gradient-to-b from-brand/[0.04] to-background py-16 lg:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-brand-gold/15 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium uppercase tracking-[0.22em] text-accent-foreground">
            {c.eyebrow}
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground text-balance sm:text-4xl">
            {c.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
            {c.lede}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="transition-transform duration-300 hover:-translate-y-1">
            <ConfirmMock isAr={isAr} />
          </div>
          <div className="transition-transform duration-300 hover:-translate-y-1 sm:mt-6">
            <ReminderMock isAr={isAr} />
          </div>
          <div className="transition-transform duration-300 hover:-translate-y-1">
            <FollowUpMock isAr={isAr} />
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/journey"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition-all hover:scale-[1.02] hover:bg-brand-light"
          >
            {c.cta}
            <Arrow className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
