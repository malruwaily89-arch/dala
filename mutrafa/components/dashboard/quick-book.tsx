"use client";

import { useEffect, useState } from "react";
import { createCalendarBookingAction } from "@/app/actions/appointments";
import { PhoneField, btnGhost, btnPrimary, inputCls } from "../ui";

export interface QuickBookService {
  id: string;
  name: string;
  durationMinutes: number;
}

/** زر "احجزي هذا الوقت" — يفتح نافذة بيانات العميلة ثم يحفظ الحجز دون مغادرة الجدول */
export function QuickBook({
  calendarId,
  calendarName,
  dayLabel,
  dayKey,
  time,
  services,
}: {
  calendarId: string;
  calendarName: string;
  dayLabel: string;
  dayKey: string;
  time: string;
  services: QuickBookService[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
      >
        احجزي هذا الوقت
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`quick-book-${time}`}
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id={`quick-book-${time}`} className="font-serif text-xl font-bold text-brand">حجز جديد</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {calendarName} · {dayLabel} · الساعة {time}
            </p>

            <form action={createCalendarBookingAction} className="mt-5 space-y-4">
              <input type="hidden" name="calendarId" value={calendarId} />
              <input type="hidden" name="date" value={dayKey} />
              <input type="hidden" name="time" value={time} />

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">الاسم</span>
                <input name="customerName" required minLength={2} className={inputCls} placeholder="اسم العميلة" />
              </label>

              <PhoneField name="customerPhone" label="الجوال" />

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">الخدمة</span>
                <select name="serviceId" required className={inputCls} defaultValue={services[0]?.id}>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} دقيقة)
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className={btnGhost}>
                  إلغاء
                </button>
                <button type="submit" className={btnPrimary}>
                  حفظ الحجز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
