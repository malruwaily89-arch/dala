"use client";

import { useState, useTransition } from "react";
import { getSlotsAction, publicBookingAction } from "@/app/actions/public";
import { formatSar } from "@/lib/money";
import { Banner, btnPrimary, btnGhost, Card, inputCls, PhoneField } from "./ui";

export interface WizardService {
  id: string;
  name: string;
  durationMinutes: number;
  priceHalalas: number;
  depositHalalas: number;
  calendarIds: string[];
}
export interface WizardCalendar {
  id: string;
  name: string;
}
export interface WizardDay {
  key: string;
  label: string;
}

const STEP_TITLES = ["الخدمة", "الموظفة", "اليوم", "الوقت", "بياناتك"];

export function BookingWizard({
  slug,
  services,
  calendars,
  days,
  error,
  depositPolicy,
}: {
  slug: string;
  services: WizardService[];
  calendars: WizardCalendar[];
  days: WizardDay[];
  error?: string;
  depositPolicy: string | null;
}) {
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string>("");
  const [calendarId, setCalendarId] = useState<string>("");
  const [dayKey, setDayKey] = useState<string>("");
  const [slots, setSlots] = useState<{ iso: string; label: string }[]>([]);
  const [startsAtIso, setStartsAtIso] = useState<string>("");
  const [loadingSlots, startLoading] = useTransition();
  const [slotsNote, setSlotsNote] = useState<string | null>(null);

  const service = services.find((s) => s.id === serviceId);
  const staff = calendars.filter((c) => service?.calendarIds.includes(c.id));
  const staffName = calendars.find((c) => c.id === calendarId)?.name ?? "";
  const dayLabel = days.find((d) => d.key === dayKey)?.label ?? "";
  const timeLabel = slots.find((s) => s.iso === startsAtIso)?.label ?? "";

  function loadSlots(nextDay: string) {
    setDayKey(nextDay);
    setStartsAtIso("");
    setSlotsNote(null);
    startLoading(async () => {
      const res = await getSlotsAction(slug, serviceId, calendarId, nextDay);
      if (!res.open) setSlotsNote("الحجز متوقف مؤقتاً لهذا الصالون.");
      setSlots(res.slots);
      if (res.slots.length === 0) setSlotsNote("لا توجد مواعيد متاحة في هذا اليوم. جرّبي يوماً آخر.");
    });
  }

  function pick(next: number) {
    setStep(next);
  }

  return (
    <Card className="p-5 md:p-7">
      <ol className="mb-6 flex flex-wrap gap-2 text-xs font-bold">
        {STEP_TITLES.map((t, i) => (
          <li
            key={t}
            aria-current={i === step ? "step" : undefined}
            className={`rounded-full px-3 py-1 ${i === step ? "bg-brand text-white" : i < step ? "bg-brand-soft text-brand" : "bg-zinc-100 text-zinc-600"}`}
          >
            {i + 1}. {t}
          </li>
        ))}
      </ol>

      {error && <Banner>{error}</Banner>}

      {step === 0 && (
        <section>
          <h2 className="mb-3 font-bold text-ink">اختاري الخدمة</h2>
          <div className="grid gap-3">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setServiceId(s.id);
                  setCalendarId("");
                  pick(1);
                }}
                className={`flex items-center justify-between rounded-xl border p-4 text-start transition hover:border-brand ${serviceId === s.id ? "border-brand bg-brand-soft" : "border-zinc-200 bg-white"}`}
              >
                <span>
                  <span className="block font-bold">{s.name}</span>
                  <span className="text-xs text-zinc-500">{s.durationMinutes} دقيقة · عربون {formatSar(s.depositHalalas)}</span>
                </span>
                <span className="font-bold text-brand">{formatSar(s.priceHalalas)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section>
          <h2 className="mb-3 font-bold text-ink">اختاري الموظفة</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {staff.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCalendarId(c.id);
                  pick(2);
                }}
                className={`rounded-xl border p-4 text-start font-bold transition hover:border-brand ${calendarId === c.id ? "border-brand bg-brand-soft" : "border-zinc-200"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="mt-5 flex justify-between">
            <button type="button" className={btnGhost} onClick={() => pick(0)}>السابق</button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="mb-3 font-bold text-ink">اختاري اليوم</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {days.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => {
                  loadSlots(d.key);
                  pick(3);
                }}
                className={`rounded-xl border p-3 text-sm font-semibold transition hover:border-brand ${dayKey === d.key ? "border-brand bg-brand-soft" : "border-zinc-200"}`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="mt-5 flex justify-between">
            <button type="button" className={btnGhost} onClick={() => pick(1)}>السابق</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 className="mb-1 font-bold text-ink">اختاري الوقت</h2>
          <p className="mb-4 text-xs text-zinc-500">{dayLabel}</p>
          {loadingSlots && <p className="text-sm text-zinc-500">جارٍ تحميل المواعيد…</p>}
          {!loadingSlots && slotsNote && <Banner tone="info">{slotsNote}</Banner>}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {slots.map((s) => (
              <button
                key={s.iso}
                type="button"
                onClick={() => {
                  setStartsAtIso(s.iso);
                  pick(4);
                }}
                className={`rounded-lg border px-2 py-2.5 text-sm font-bold transition hover:border-brand ${startsAtIso === s.iso ? "border-brand bg-brand-soft" : "border-zinc-200"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="mt-5 flex justify-between">
            <button type="button" className={btnGhost} onClick={() => pick(2)}>السابق</button>
          </div>
        </section>
      )}

      {step === 4 && (
        <form action={publicBookingAction} className="space-y-5">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="serviceId" value={serviceId} />
          <input type="hidden" name="calendarId" value={calendarId} />
          <input type="hidden" name="startsAtIso" value={startsAtIso} />

          <h2 className="font-bold text-ink">بياناتك</h2>
          <p className="text-sm text-zinc-600">بيانات بسيطة لتأكيد الموعد. سيراها الصالون، وسيتواصل معك عبر واتساب على هذا الرقم.</p>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">الاسم</span>
            <input name="name" required minLength={2} className={inputCls} />
          </label>
          <PhoneField name="phone" label="الجوال" />

          <div className="rounded-xl bg-zinc-50 p-4 text-sm">
            <p className="mb-2 font-bold text-ink">ملخص الحجز</p>
            <p>الخدمة: {service?.name}</p>
            <p>الموظفة: {staffName}</p>
            <p>الموعد: {dayLabel} — {timeLabel}</p>
            <p className="mt-2 font-bold text-brand">
              العربون المستحق الآن: {formatSar(service?.depositHalalas ?? 0)}
              {(service?.depositHalalas ?? 0) === 0 && " (لا يوجد عربون لهذه الخدمة)"}
            </p>
          </div>

          {depositPolicy && <p className="rounded-lg border border-gold/30 bg-gold-soft p-3 text-xs text-brand-deep">{depositPolicy}</p>}

          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="policy" required className="mt-1 h-4 w-4 accent-brand" />
            <span>اطلعت على سياسة الصالون وأوافق عليها.</span>
          </label>

          <div className="flex flex-wrap justify-between gap-3">
            <button type="button" className={btnGhost} onClick={() => pick(3)}>السابق</button>
            <button type="submit" className={btnPrimary}>
              {(service?.depositHalalas ?? 0) > 0 ? "متابعة إلى الدفع" : "تأكيد الحجز"}
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
