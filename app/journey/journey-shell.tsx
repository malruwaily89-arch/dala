"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLanguage } from "@/components/language-provider";
import { MockFrame } from "../features/feature-mocks";

function useT<T>(ar: T, en: T): T {
  const { lang } = useLanguage();
  return lang === "en" ? en : ar;
}

/* -------------------------- shared mock pieces -------------------------- */

function WaBubble({ salon, children, time }: { salon?: boolean; children: React.ReactNode; time: string }) {
  return (
    <div className={`flex ${salon ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[88%] rounded-xl px-3 py-2 text-start shadow-sm ${
          salon ? "rounded-tl-none bg-white" : "rounded-tr-none bg-[#dcf8c6]"
        }`}
      >
        <p className="text-xs leading-5 text-foreground">{children}</p>
        <p className="mt-0.5 text-end text-[9px] text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

function AutoTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-bold text-accent-foreground">
      ⚙️ {children}
    </span>
  );
}

/* --------------------------------- steps --------------------------------- */

const copy = {
  ar: {
    title: "رحلة عميلة كاملة مع دلال",
    lede: "من لحظة ما تشوف رابط الحجز، إلى تأكيد وتذكير ومتابعة تلقائيين عبر واتساب — كل شاشة مطابقة لخطوات النظام الفعلية.",
    legend: [
      "شاشات إلكترونية (الحجز)",
      "رسائل واتساب تلقائية 100%",
      "تدخل بشري: صفر — إلا الرد الاختياري من العميلة",
    ],
    cta: "ابدئي تجربتك المجانية",
    steps: [
      {
        label: "تختار الخدمة والموظفة",
        sub: "صفحة الحجز الإلكترونية",
        caption: "تختار «قص وتصفيف» مع سارة — الأسعار والمدة واضحة قبل أي التزام.",
      },
      {
        label: "الوقت والعربون",
        sub: "تثبيت الموعد إلكترونياً",
        caption: "تدفع عربوناً إلكترونياً — الموعد يتثبّت فوراً في نظام الصالون.",
      },
      {
        label: "تأكيد واتساب تلقائي",
        sub: "بدون أي تدخل من الصالون",
        caption: "فور إتمام الدفع، يرسل النظام رسالة التأكيد تلقائياً من رقم واتساب الصالون المسجّل — بدون ما تكتب الموظفة كلمة.",
      },
      {
        label: "تذكير تلقائي قبل الموعد",
        sub: "قبل 24 ساعة",
        caption: "قبل الموعد بـ24 ساعة، يصل تذكير تلقائي يقلل نسبة الغياب — بدون متابعة يدوية.",
      },
      {
        label: "متابعة بعد الزيارة",
        sub: "تُبنى السمعة تلقائياً",
        caption: "رسالة شكر تلقائية مع رابط تقييم مباشر — تساعدك تجمعين آراء عميلاتك بدون أي جهد.",
      },
    ],
  },
  en: {
    title: "A full client journey with Dala",
    lede: "From the moment she spots your booking link, to automatic WhatsApp confirmation, reminder, and follow-up — every screen matches the system's real steps.",
    legend: [
      "Booking screens",
      "100% automatic WhatsApp messages",
      "Human involvement: zero — except the client's own optional reply",
    ],
    cta: "Start your free trial",
    steps: [
      {
        label: "Picks a service and stylist",
        sub: "Your booking page",
        caption: "She picks \"Cut & Style\" with Sara — price and duration are clear before any commitment.",
      },
      {
        label: "Time and deposit",
        sub: "Locks the slot online",
        caption: "She pays a deposit online — the appointment is instantly confirmed in the salon's system.",
      },
      {
        label: "Automatic WhatsApp confirmation",
        sub: "No action from the salon",
        caption: "The moment payment clears, the system sends the confirmation automatically from the salon's own WhatsApp number — no staff member types a word.",
      },
      {
        label: "Automatic reminder",
        sub: "24 hours before",
        caption: "A reminder arrives automatically 24 hours ahead, cutting no-shows — with no manual follow-up.",
      },
      {
        label: "Follow-up after the visit",
        sub: "Reputation builds itself",
        caption: "An automatic thank-you with a direct review link — helping you collect feedback with zero effort.",
      },
    ],
  },
};

export function JourneyShell() {
  const { lang, dir } = useLanguage();
  const c = useT(copy.ar, copy.en);
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const isAr = lang !== "en";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-brand-gold/15 blur-3xl" />
            <div className="absolute top-40 -left-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-14 text-center sm:px-6 lg:px-8 lg:pt-20">
            <h1 className="mx-auto max-w-3xl font-serif text-3xl font-semibold text-foreground text-balance sm:text-4xl lg:text-5xl">
              {c.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
              {c.lede}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div
            className="flex gap-6 overflow-x-auto pb-6 [scrollbar-width:thin] lg:flex-wrap lg:justify-center lg:gap-y-12 lg:overflow-visible"
            style={{ scrollSnapType: "x proximity" }}
          >
            {c.steps.map((step, i) => (
              <div key={step.label} className="flex shrink-0 items-start gap-6" style={{ scrollSnapAlign: "start" }}>
                <div className="flex w-[280px] flex-col items-center">
                  <div className="mb-3.5 flex w-full items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{step.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{step.sub}</p>
                    </div>
                  </div>

                  {i === 0 && <ChooseMock isAr={isAr} />}
                  {i === 1 && <TimeDepositMock isAr={isAr} />}
                  {i === 2 && <ConfirmMock isAr={isAr} />}
                  {i === 3 && <ReminderMock isAr={isAr} />}
                  {i === 4 && <FollowUpMock isAr={isAr} />}

                  <p className="mt-4 max-w-[260px] text-center text-xs leading-relaxed text-muted-foreground">
                    {step.caption}
                  </p>
                </div>

                {i < c.steps.length - 1 && (
                  <div className="mt-24 flex h-7 w-7 shrink-0 items-center justify-center text-brand-gold lg:hidden">
                    <Arrow className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-border pt-8">
            <LegendItem colorClass="bg-brand" label={c.legend[0]} />
            <LegendItem colorClass="bg-emerald-600" label={c.legend[1]} />
            <LegendItem colorClass="bg-brand-gold" label={c.legend[2]} />
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition-all hover:scale-[1.02] hover:bg-brand-light"
            >
              {c.cta}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function LegendItem({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-bold text-foreground/80">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colorClass}`} />
      {label}
    </div>
  );
}

/* --------------------------------- mocks --------------------------------- */

function ChooseMock({ isAr }: { isAr: boolean }) {
  const services = isAr
    ? [{ name: "قص وتصفيف", price: "120 ر.س" }, { name: "صبغة كاملة", price: "280 ر.س" }]
    : [{ name: "Cut & Style", price: "SAR 120" }, { name: "Full Color", price: "SAR 280" }];
  const staff = isAr ? ["سارة", "بدون تفضيل"] : ["Sara", "No preference"];
  return (
    <MockFrame kind="phone" title={isAr ? "صالون ميزون روز" : "Maison Rose Salon"}>
      <div className="space-y-3 bg-muted/30 p-4">
        <div>
          <p className="mb-2 text-xs font-bold text-foreground">
            {isAr ? "١. اختاري خدمتك" : "1. Choose your service"}
          </p>
          <div className="space-y-1.5">
            {services.map((s, i) => (
              <div
                key={s.name}
                className={`flex items-center justify-between rounded-xl border p-2.5 ${
                  i === 0 ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-border bg-card"
                }`}
              >
                <span className="text-xs font-semibold text-foreground">{s.name}</span>
                <span className="text-xs font-bold text-brand-gold">{s.price}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-foreground">
            {isAr ? "٢. اختاري الموظفة" : "2. Choose your stylist"}
          </p>
          <div className="space-y-1.5">
            {staff.map((s, i) => (
              <div
                key={s}
                className={`rounded-xl border p-2.5 text-xs font-semibold ${
                  i === 0 ? "border-brand bg-brand/5 text-foreground ring-1 ring-brand" : "border-dashed border-border bg-card text-muted-foreground"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockFrame>
  );
}

function TimeDepositMock({ isAr }: { isAr: boolean }) {
  const times = isAr ? ["3:00", "4:00", "5:00", "5:30", "6:00", "6:30"] : ["3:00", "4:00", "5:00", "5:30", "6:00", "6:30"];
  return (
    <MockFrame kind="phone" title={isAr ? "صالون ميزون روز" : "Maison Rose Salon"}>
      <div className="space-y-3 bg-muted/30 p-4">
        <p className="text-xs font-bold text-foreground">
          {isAr ? "الوقت المناسب — الخميس" : "Pick a time — Thursday"}
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {times.map((t, i) => (
            <span
              key={t}
              className={`rounded-full py-1.5 text-center text-[11px] font-bold ${
                i === 2 ? "bg-brand text-white" : "border border-border bg-card text-muted-foreground"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="space-y-1.5 rounded-xl border border-border bg-card p-2.5">
          <p className="text-[11px] text-muted-foreground">{isAr ? "نوف العتيبي" : "Nouf Al-Otaibi"}</p>
          <p dir="ltr" className="text-[11px] text-muted-foreground">05xxxxxxxx</p>
        </div>
        <div className="rounded-full bg-brand py-2.5 text-center text-xs font-bold text-white shadow-md shadow-brand/20">
          {isAr ? "تأكيد الحجز 🌸 — عربون 40 ر.س" : "Confirm booking 🌸 — SAR 40 deposit"}
        </div>
      </div>
    </MockFrame>
  );
}

export function ConfirmMock({ isAr }: { isAr: boolean }) {
  return (
    <MockFrame kind="phone" title="WhatsApp">
      <div className="space-y-2 bg-[#e7e4de] p-4">
        <div>
          <AutoTag>{isAr ? "إرسال تلقائي" : "Sent automatically"}</AutoTag>
          <WaBubble salon time={isAr ? "4:02 م" : "4:02 PM"}>
            {isAr ? (
              <>مرحباً نوف 🌸<br />تم تأكيد حجزك بنجاح ✅<br />الخدمة: قص وتصفيف مع سارة<br />الخميس 5:00 م · رقم الحجز #A1284</>
            ) : (
              <>Hi Nouf 🌸<br />Your booking is confirmed ✅<br />Cut &amp; Style with Sara<br />Thursday 5:00 PM · Booking #A1284</>
            )}
          </WaBubble>
        </div>
        <p className="pt-1 text-center text-[10px] text-muted-foreground">
          {isAr ? "مرسلة تلقائياً من رقم صالونك المسجّل في واتساب" : "Sent automatically from your salon's own WhatsApp number"}
        </p>
      </div>
    </MockFrame>
  );
}

export function ReminderMock({ isAr }: { isAr: boolean }) {
  return (
    <MockFrame kind="phone" title="WhatsApp">
      <div className="space-y-2 bg-[#e7e4de] p-4">
        <div>
          <AutoTag>{isAr ? "إرسال تلقائي" : "Sent automatically"}</AutoTag>
          <WaBubble salon time={isAr ? "6:15 م" : "6:15 PM"}>
            {isAr ? (
              <>مرحباً نوف 🌸<br />تذكير بموعدك غداً الخميس الساعة 5:00 م مع سارة.<br />نتشرف بزيارتك ✨</>
            ) : (
              <>Hi Nouf 🌸<br />Reminder: your appointment is tomorrow, Thursday 5:00 PM with Sara.<br />See you soon ✨</>
            )}
          </WaBubble>
        </div>
        <p className="flex items-center justify-center gap-1 pt-1 text-center text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" /> {isAr ? "قبل الموعد بـ 24 ساعة" : "24 hours before the appointment"}
        </p>
      </div>
    </MockFrame>
  );
}

export function FollowUpMock({ isAr }: { isAr: boolean }) {
  return (
    <MockFrame kind="phone" title="WhatsApp">
      <div className="space-y-2 bg-[#e7e4de] p-4">
        <div>
          <AutoTag>{isAr ? "إرسال تلقائي" : "Sent automatically"}</AutoTag>
          <WaBubble salon time={isAr ? "7:40 م" : "7:40 PM"}>
            {isAr ? (
              <>نورتِ صالوننا اليوم يا نوف 🌸<br />رأيك يسعدنا — شاركينا تجربتك:<br /><span dir="ltr" className="font-mono text-[10px]">d-alal.com/r/A1284</span></>
            ) : (
              <>Thank you for visiting today, Nouf 🌸<br />Your feedback means a lot — share it here:<br /><span dir="ltr" className="font-mono text-[10px]">d-alal.com/r/A1284</span></>
            )}
          </WaBubble>
        </div>
        <WaBubble time={isAr ? "7:52 م ✓✓" : "7:52 PM ✓✓"}>
          {isAr ? "تجربة رائعة، شكراً 🌸✨" : "Wonderful experience, thank you 🌸✨"}
        </WaBubble>
      </div>
    </MockFrame>
  );
}
