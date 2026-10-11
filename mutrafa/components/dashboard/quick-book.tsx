"use client";

import { useEffect, useState } from "react";
import { createCalendarBookingAction, createFreeformBookingAction } from "@/app/actions/appointments";
import { PhoneField, btnGhost, btnPrimary, inputCls, selectCls } from "../ui";

export interface QuickBookService {
  id: string;
  name: string;
  durationMinutes: number;
}

type Mode = "standard" | "custom" | "block";

const BLOCK_LABELS = ["استراحة", "تنظيف", "تحضير الأدوات", "إجازة قصيرة"];

/** زر "احجزي هذا الوقت": يفتح نافذة تختار نوع الحجز ثم تحفظه دون مغادرة الجدول */
export function QuickBook({
  calendarId,
  calendarName,
  dayLabel,
  dayKey,
  time,
  services,
  gapMinutes,
  hasStandard,
}: {
  calendarId: string;
  calendarName: string;
  dayLabel: string;
  dayKey: string;
  time: string;
  services: QuickBookService[];
  gapMinutes: number;
  hasStandard: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(hasStandard ? "standard" : "custom");
  const [duration, setDuration] = useState<number>(Math.min(60, Math.floor(gapMinutes / 15) * 15) || 15);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // مدد تتسع في الفترة الفارغة (خطوة 15 دقيقة)
  const durationOptions: number[] = [];
  for (let v = 15; v <= Math.min(gapMinutes, 480); v += 15) durationOptions.push(v);

  const action = mode === "standard" ? createCalendarBookingAction : createFreeformBookingAction;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMode(hasStandard ? "standard" : "custom");
          setOpen(true);
        }}
        className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
      >
        احجزي هذا الوقت
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="font-serif text-xl font-bold text-brand">حجز جديد</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {calendarName} · {dayLabel} · الساعة {time} · الفترة الفارغة {gapMinutes} دقيقة
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-bold">
              {[
                { key: "standard" as const, label: "خدمة من القائمة", disabled: !hasStandard },
                { key: "custom" as const, label: "خدمة غير مسجلة", disabled: false },
                { key: "block" as const, label: "استراحة / تنظيف", disabled: false },
              ].map((o) => (
                <button
                  key={o.key}
                  type="button"
                  disabled={o.disabled}
                  onClick={() => setMode(o.key)}
                  className={`rounded-xl border px-2 py-2.5 transition disabled:opacity-40 ${
                    mode === o.key ? "border-brand bg-brand-soft text-brand" : "border-zinc-200 text-zinc-600"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <form action={action} className="mt-5 space-y-4">
              <input type="hidden" name="calendarId" value={calendarId} />
              <input type="hidden" name="date" value={dayKey} />
              <input type="hidden" name="time" value={time} />
              {mode === "block" && <input type="hidden" name="kind" value="BLOCK" />}
              {mode === "custom" && <input type="hidden" name="kind" value="CUSTOM" />}

              {mode === "standard" && (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold">الخدمة</span>
                    <select name="serviceId" required className={selectCls}>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.durationMinutes} دقيقة)</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold">اسم العميلة</span>
                    <input name="customerName" required minLength={2} className={inputCls} />
                  </label>
                  <PhoneField name="customerPhone" label="الجوال" />
                </>
              )}

              {mode === "custom" && (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold">اسم الخدمة</span>
                    <input name="label" required minLength={2} className={inputCls} placeholder="اكتبي اسم الخدمة" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold">سعر الخدمة (ر.س)</span>
                    <input name="priceSar" type="number" min={0} step="0.5" required className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold">اسم العميلة</span>
                    <input name="customerName" required minLength={2} className={inputCls} />
                  </label>
                  <PhoneField name="customerPhone" label="الجوال" />
                </>
              )}

              {mode === "block" && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">السبب</span>
                  <select name="blockLabel" className={selectCls} defaultValue={BLOCK_LABELS[0]}>
                    {BLOCK_LABELS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </label>
              )}

              {mode !== "standard" && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">المدة</span>
                  <select
                    name="durationMinutes"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className={selectCls}
                  >
                    {durationOptions.map((v) => (
                      <option key={v} value={v}>{v} دقيقة</option>
                    ))}
                  </select>
                </label>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className={btnGhost}>إلغاء</button>
                <button type="submit" className={btnPrimary}>حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
