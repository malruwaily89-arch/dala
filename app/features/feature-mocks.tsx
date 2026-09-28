"use client";

import type { ReactNode } from "react";
import { Check, Clock, CreditCard, Star, Wallet } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import type { FeatureSlug } from "./feature-data";

function useMock<T>(ar: T, en: T): T {
  const { lang } = useLanguage();
  return lang === "en" ? en : ar;
}

export function MockFrame({
  kind = "browser",
  title,
  children,
}: {
  kind?: "browser" | "phone";
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className={
        kind === "phone"
          ? "mx-auto w-full max-w-[340px]"
          : "mx-auto w-full max-w-3xl"
      }
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/10">
        <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="mx-auto text-xs font-medium text-muted-foreground">
            {title}
          </span>
          <span className="w-10" />
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------ Booking ------------------------------ */

const bookingMock = {
  ar: {
    salon: "صالون نور",
    steps: ["الخدمة", "الموعد", "العربون", "التأكيد"],
    services: [
      { name: "قص وتصفيف", price: "120 ر.س", duration: "60 دقيقة" },
      { name: "صبغة شعر", price: "250 ر.س", duration: "120 دقيقة" },
    ],
    withWho: "مع من تحبين جلستك؟",
    staff: ["سارة", "نورة", "لمى"],
    dayLabel: "اختاري اليوم",
    days: ["اليوم", "غداً", "الخميس"],
    timeLabel: "اختاري الوقت",
    times: ["4:00 م", "4:30 م", "5:00 م", "5:30 م"],
    deposit: "عربون لتثبيت الحجز",
    depositNote: "يُخصم من قيمة الخدمة عند حضورك",
    confirm: "تأكيد الحجز",
  },
  en: {
    salon: "Noor Salon",
    steps: ["Service", "Time", "Deposit", "Done"],
    services: [
      { name: "Cut & Style", price: "SAR 120", duration: "60 min" },
      { name: "Hair Color", price: "SAR 250", duration: "120 min" },
    ],
    withWho: "Who would you like to see?",
    staff: ["Sara", "Noura", "Lama"],
    dayLabel: "Pick a day",
    days: ["Today", "Tomorrow", "Thursday"],
    timeLabel: "Pick a time",
    times: ["4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM"],
    deposit: "Deposit to lock your slot",
    depositNote: "Deducted from your service total at the visit",
    confirm: "Confirm booking",
  },
};

export function BookingMock() {
  const m = useMock(bookingMock.ar, bookingMock.en);
  return (
    <MockFrame kind="phone" title={m.salon}>
      <div className="bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          {m.steps.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  i <= 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                {s}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm font-bold text-foreground">{m.withWho}</p>
        <div className="mt-2 space-y-2">
          {m.services.map((s, i) => (
            <div
              key={s.name}
              className={`flex items-center justify-between rounded-xl border p-3 ${
                i === 0
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{s.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> {s.duration}
                </p>
              </div>
              <span className="text-sm font-bold text-primary">{s.price}</span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm font-bold text-foreground">{m.dayLabel}</p>
        <div className="mt-2 flex gap-2">
          {m.days.map((d, i) => (
            <span
              key={d}
              className={`flex-1 rounded-full py-1.5 text-center text-xs font-semibold ${
                i === 2 ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"
              }`}
            >
              {d}
            </span>
          ))}
        </div>

        <p className="mt-3 text-sm font-bold text-foreground">{m.timeLabel}</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {m.times.map((t, i) => (
            <span
              key={t}
              className={`rounded-lg py-1.5 text-center text-xs font-semibold ${
                i === 2 ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"
              }`}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-accent/50 bg-accent/10 p-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-accent-foreground" />
            <div>
              <p className="text-xs font-bold text-foreground">{m.deposit}</p>
              <p className="text-[10px] text-muted-foreground">{m.depositNote}</p>
            </div>
          </div>
          <span className="text-sm font-extrabold text-accent-foreground">40 ر.س</span>
        </div>

        <div className="mt-4 rounded-xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground">
          {m.confirm}
        </div>
      </div>
    </MockFrame>
  );
}

/* -------------------------------- Team ------------------------------- */

const teamMock = {
  ar: {
    title: "تقويم الفريق",
    free: "متاح",
    days: ["السبت", "الأحد", "الاثنين"],
    staff: [
      { name: "سارة", role: "أخصائية شعر", shift: "9 ص – 5 م", slots: ["5:00 م", "6:00 م", "—"] },
      { name: "نورة", role: "أخصائية أظافر", shift: "إجازة", slots: ["—", "—", "12:00 م"] },
      { name: "لمى", role: "أخصائية بشرة", shift: "1 م – 9 م", slots: ["2:00 م", "7:00 م", "8:00 م"] },
    ],
  },
  en: {
    title: "Team calendar",
    free: "Open",
    days: ["Saturday", "Sunday", "Monday"],
    staff: [
      { name: "Sara", role: "Hair specialist", shift: "9 AM – 5 PM", slots: ["5:00 PM", "6:00 PM", "—"] },
      { name: "Noura", role: "Nail specialist", shift: "Day off", slots: ["—", "—", "12:00 PM"] },
      { name: "Lama", role: "Skin specialist", shift: "1 PM – 9 PM", slots: ["2:00 PM", "7:00 PM", "8:00 PM"] },
    ],
  },
};

export function TeamMock() {
  const m = useMock(teamMock.ar, teamMock.en);
  return (
    <MockFrame title={m.title}>
      <div className="p-4">
        <div className="grid grid-cols-[110px_repeat(3,1fr)] gap-2 text-xs">
          <div />
          {m.days.map((d) => (
            <div key={d} className="rounded-lg bg-secondary py-2 text-center font-bold text-foreground">
              {d}
            </div>
          ))}
          {m.staff.map((s) => (
            <div key={s.name} className="contents">
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="font-bold text-foreground">{s.name}</p>
                <p className="text-[10px] text-muted-foreground">{s.role}</p>
                <p className="mt-1 text-[10px] font-semibold text-primary">{s.shift}</p>
              </div>
              {s.slots.map((slot, i) => (
                <div key={i} className="flex min-h-12 items-center justify-center rounded-lg border border-border bg-card">
                  {slot !== "—" ? (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                      {slot}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/50">{m.free}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </MockFrame>
  );
}

/* ------------------------------ Payments ----------------------------- */

const paymentsMock = {
  ar: {
    title: "تقرير المدفوعات — اليوم",
    headers: ["العميلة", "الخدمة", "العربون", "الحالة"],
    totals: [
      { label: "محصّل اليوم", value: "1,240 ر.س" },
      { label: "عرابون مؤكدة", value: "12" },
      { label: "عرابون معلقة", value: "3" },
    ],
    rows: [
      { client: "نوف العتيبي", service: "قص وتصفيف", deposit: "40 ر.س", status: "مدفوع" },
      { client: "ريم الحربي", service: "صبغة شعر", deposit: "80 ر.س", status: "مدفوع" },
      { client: "جود الشمري", service: "مانيكير", deposit: "30 ر.س", status: "معلق" },
      { client: "شهد القحطاني", service: "تنظيف بشرة", deposit: "60 ر.س", status: "مدفوع" },
    ],
  },
  en: {
    title: "Payments report — today",
    headers: ["Client", "Service", "Deposit", "Status"],
    totals: [
      { label: "Collected today", value: "SAR 1,240" },
      { label: "Confirmed deposits", value: "12" },
      { label: "Pending deposits", value: "3" },
    ],
    rows: [
      { client: "Nouf Al-Otaibi", service: "Cut & Style", deposit: "SAR 40", status: "Paid" },
      { client: "Reem Al-Harbi", service: "Hair Color", deposit: "SAR 80", status: "Paid" },
      { client: "Joud Al-Shammari", service: "Manicure", deposit: "SAR 30", status: "Pending" },
      { client: "Shahad Al-Qahtani", service: "Facial", deposit: "SAR 60", status: "Paid" },
    ],
  },
};

export function PaymentsMock() {
  const m = useMock(paymentsMock.ar, paymentsMock.en);
  const isAr = m.rows[0].client.includes("نوف");
  return (
    <MockFrame title={m.title}>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {m.totals.map((t) => (
            <div key={t.label} className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-sm font-extrabold text-primary">{t.value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{t.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-secondary text-foreground">
              <tr>
                {m.headers.map((h) => (
                  <th key={h} className="px-3 py-2 text-start font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.rows.map((r) => (
                <tr key={r.client} className="border-t border-border bg-card">
                  <td className="px-3 py-2 font-semibold text-foreground">{r.client}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.service}</td>
                  <td className="px-3 py-2 font-semibold text-primary">{r.deposit}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.status === "مدفوع" || r.status === "Paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5" />
          {isAr ? "العرابون تصل حسابك المصرفي مباشرة" : "Deposits go straight to your bank account"}
        </p>
      </div>
    </MockFrame>
  );
}

/* ------------------------------ Clients ------------------------------ */

const clientsMock = {
  ar: {
    title: "ملف عميلة",
    name: "نوف العتيبي",
    phone: "05X XXX XXXX",
    stats: [
      { label: "زيارات", value: "12" },
      { label: "آخر زيارة", value: "قبل 5 أيام" },
      { label: "غيابات", value: "0" },
    ],
    tags: ["قص وتصفيف", "تقييم 5 نجوم"],
    note: "تفضّل مواعيد المساء وتستخدم صبغة خالية من الأمونيا",
    history: [
      { date: "12 سبتمبر", service: "صبغة شعر", status: "مكتمل" },
      { date: "28 أغسطس", service: "قص وتصفيف", status: "مكتمل" },
      { date: "15 أغسطس", service: "قص وتصفيف", status: "مكتمل" },
    ],
  },
  en: {
    title: "Client profile",
    name: "Nouf Al-Otaibi",
    phone: "05X XXX XXXX",
    stats: [
      { label: "Visits", value: "12" },
      { label: "Last visit", value: "5 days ago" },
      { label: "No-shows", value: "0" },
    ],
    tags: ["Cut & Style", "5-star rating"],
    note: "Prefers evening slots and uses ammonia-free color",
    history: [
      { date: "Sep 12", service: "Hair Color", status: "Done" },
      { date: "Aug 28", service: "Cut & Style", status: "Done" },
      { date: "Aug 15", service: "Cut & Style", status: "Done" },
    ],
  },
};

export function ClientsMock() {
  const m = useMock(clientsMock.ar, clientsMock.en);
  const isAr = m.name.includes("نوف");
  return (
    <MockFrame title={m.title}>
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              ن
            </span>
            <div>
              <p className="font-bold text-foreground">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.phone}</p>
            </div>
            <span className="ms-auto rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              {isAr ? "وفية" : "Loyal"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {m.stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-secondary p-2 text-center">
                <p className="text-sm font-extrabold text-primary">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {m.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-3 rounded-lg bg-muted/60 p-2.5 text-[11px] leading-5 text-muted-foreground">
            {m.note}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-bold text-foreground">{isAr ? "سجل الزيارات" : "Visit history"}</p>
          <div className="mt-3 space-y-3">
            {m.history.map((h) => (
              <div key={h.date} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <div>
                  <p className="text-xs font-semibold text-foreground">{h.service}</p>
                  <p className="text-[10px] text-muted-foreground">{h.date}</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <Check className="h-3 w-3" />
                  {h.status}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-accent/50 bg-accent/10 p-2.5 text-[11px] font-semibold text-accent-foreground">
            {isAr ? "عداد الغيابات: 0 — عميلة موثوقة" : "No-show counter: 0 — reliable client"}
          </div>
        </div>
      </div>
    </MockFrame>
  );
}

/* ----------------------------- Marketing ----------------------------- */

const marketingMock = {
  ar: {
    title: "واتساب",
    messages: [
      { from: "salon", text: "مرحباً نوف 🌸 تذكير بموعدك غداً الخميس الساعة 5:00 م مع سارة", time: "9:00 ص" },
      { from: "client", text: "شكراً، سأحضر بإذن الله 🌸", time: "9:04 ص" },
      { from: "salon", text: "نوف 🎁 بمناسبة زياراتك الخمس معنا — خصم 20% على موعدك القادم 🌸", time: "2:30 م" },
      { from: "client", text: "ما شاء الله، أكيد بحجز قريب 🌸", time: "2:35 م" },
    ],
  },
  en: {
    title: "WhatsApp",
    messages: [
      { from: "salon", text: "Hi Nouf 🌸 Reminder of your appointment tomorrow, Thursday 5:00 PM with Sara", time: "9:00 AM" },
      { from: "client", text: "Thank you, I'll be there 🌸", time: "9:04 AM" },
      { from: "salon", text: "Nouf 🎁 To celebrate your 5 visits with us — 20% off your next appointment 🌸", time: "2:30 PM" },
      { from: "client", text: "Amazing, I'll book soon 🌸", time: "2:35 PM" },
    ],
  },
};

export function MarketingMock() {
  const m = useMock(marketingMock.ar, marketingMock.en);
  return (
    <MockFrame kind="phone" title={m.title}>
      <div className="space-y-2 bg-[#e7e4de] p-4">
        {m.messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.from === "salon" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 shadow-sm ${
                msg.from === "salon" ? "rounded-tl-none bg-white" : "rounded-tr-none bg-[#dcf8c6]"
              }`}
            >
              <p className="text-xs leading-5 text-foreground">{msg.text}</p>
              <p className="mt-0.5 text-end text-[9px] text-muted-foreground">{msg.time}</p>
            </div>
          </div>
        ))}
        <p className="pt-1 text-center text-[10px] text-muted-foreground">
          {m.messages[0].text.includes("تذكير") ? "مرسلة تلقائياً من رقم صالونك" : "Sent automatically from your salon number"}
        </p>
      </div>
    </MockFrame>
  );
}

/* ------------------------------ Reports ------------------------------ */

const reportsMock = {
  ar: {
    title: "لوحة التقارير",
    stats: [
      { label: "إيراد اليوم", value: "1,240 ر.س" },
      { label: "حجوزات اليوم", value: "18" },
      { label: "نسبة الحضور", value: "94%" },
    ],
    chart: [
      { day: "أحد", v: 40 },
      { day: "اثنين", v: 55 },
      { day: "ثلاثاء", v: 35 },
      { day: "أربعاء", v: 70 },
      { day: "خميس", v: 60 },
      { day: "جمعة", v: 95 },
      { day: "سبت", v: 80 },
    ],
    topTitle: "أفضل الخدمات",
    top: [
      { name: "قص وتصفيف", pct: 82, revenue: "960 ر.س" },
      { name: "صبغة شعر", pct: 65, revenue: "780 ر.س" },
      { name: "مانيكير", pct: 48, revenue: "430 ر.س" },
    ],
  },
  en: {
    title: "Reports dashboard",
    stats: [
      { label: "Today's revenue", value: "SAR 1,240" },
      { label: "Today's bookings", value: "18" },
      { label: "Attendance", value: "94%" },
    ],
    chart: [
      { day: "Sun", v: 40 },
      { day: "Mon", v: 55 },
      { day: "Tue", v: 35 },
      { day: "Wed", v: 70 },
      { day: "Thu", v: 60 },
      { day: "Fri", v: 95 },
      { day: "Sat", v: 80 },
    ],
    topTitle: "Top services",
    top: [
      { name: "Cut & Style", pct: 82, revenue: "SAR 960" },
      { name: "Hair Color", pct: 65, revenue: "SAR 780" },
      { name: "Manicure", pct: 48, revenue: "SAR 430" },
    ],
  },
};

export function ReportsMock() {
  const m = useMock(reportsMock.ar, reportsMock.en);
  const isAr = m.stats[0].label.includes("إيراد");
  return (
    <MockFrame title={m.title}>
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="grid grid-cols-3 gap-2">
            {m.stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-secondary p-2 text-center">
                <p className="text-sm font-extrabold text-primary">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs font-bold text-foreground">{isAr ? "إيراد الأسبوع" : "Week revenue"}</p>
          <div className="mt-2 flex h-28 items-end gap-1.5">
            {m.chart.map((c) => (
              <div key={c.day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/50"
                  style={{ height: `${c.v}%` }}
                />
                <span className="text-[9px] text-muted-foreground">{c.day}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-bold text-foreground">{m.topTitle}</p>
          <div className="mt-3 space-y-3">
            {m.top.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{s.name}</span>
                  <span className="flex items-center gap-1 font-bold text-primary">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    {s.revenue}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-lg bg-muted/60 p-2.5 text-[11px] leading-5 text-muted-foreground">
            {isAr
              ? "تقارير أسبوعية تلقائية، ومقارنة شهر بشهر في باقات برو"
              : "Automatic weekly reports, month-over-month on Pro plans"}
          </p>
        </div>
      </div>
    </MockFrame>
  );
}

/* ----------------------------- Dispatcher ---------------------------- */

const MOCKS: Record<FeatureSlug, () => ReactNode> = {
  booking: BookingMock,
  team: TeamMock,
  payments: PaymentsMock,
  clients: ClientsMock,
  marketing: MarketingMock,
  reports: ReportsMock,
};

export function FeatureMock({ slug }: { slug: FeatureSlug }) {
  const Mock = MOCKS[slug];
  return <Mock />;
}
