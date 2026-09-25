"use client";

import { useEffect, useState, useTransition } from "react";
import { fetchSlotsAction } from "../../fetch-slots";
import { rescheduleAppointmentAction } from "./actions";

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function RescheduleSection({
  slug,
  code,
  tenantId,
  staffId,
  serviceId,
}: {
  slug: string;
  code: string;
  tenantId: string;
  staffId: string;
  serviceId: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 w-full rounded-full py-3.5 text-sm font-extrabold text-white transition hover:opacity-90"
        style={{
          backgroundColor: "var(--brand)",
          boxShadow: "0 12px 30px -8px color-mix(in srgb, var(--brand) 45%, transparent)",
        }}
      >
        تعديل الموعد
      </button>
    );
  }

  return (
    <div className="mt-6 rounded-[28px] border border-pink-100 bg-pink-50/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-extrabold text-zinc-800">اختاري موعداً جديداً</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-bold text-zinc-400 hover:text-zinc-600"
        >
          إلغاء
        </button>
      </div>
      <RescheduleSlots slug={slug} code={code} tenantId={tenantId} staffId={staffId} serviceId={serviceId} />
    </div>
  );
}

function RescheduleSlots({
  slug,
  code,
  tenantId,
  staffId,
  serviceId,
}: {
  slug: string;
  code: string;
  tenantId: string;
  staffId: string;
  serviceId: string;
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState(0);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      setLoadError(false);
      try {
        const result = await fetchSlotsAction({
          tenantId,
          staffId,
          serviceId,
          dateIso: days[selectedDay].toISOString(),
        });
        setSlots(result);
      } catch {
        setSlots([]);
        setLoadError(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  return (
    <form action={rescheduleAppointmentAction}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="code" value={code} />

      <div className="flex gap-2.5 overflow-x-auto pb-1.5">
        {days.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelectedDay(i)}
            style={
              selectedDay === i
                ? { backgroundColor: "var(--brand)", borderColor: "var(--brand)" }
                : undefined
            }
            className={`shrink-0 rounded-[20px] border-2 px-4.5 py-3 transition ${
              selectedDay === i
                ? "border-transparent text-white shadow-md"
                : "border-pink-100 bg-white text-zinc-600 hover:border-pink-300"
            }`}
          >
            <span className="block text-xs font-bold">{DAY_NAMES[d.getDay()]}</span>
            <span className="block text-sm">{d.getDate()}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 min-h-24">
        {pending ? (
          <p className="text-sm text-zinc-400">جارٍ البحث عن أجمل الأوقات المتاحة…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {loadError
              ? "تعذر جلب المواعيد — أعيدي المحاولة بتغيير اليوم."
              : "لا مواعيد متاحة هذا اليوم — جرّبي يوماً آخر."}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {slots.map((iso) => (
              <label key={iso} className="cursor-pointer">
                <input type="radio" name="slotIso" value={iso} required className="peer sr-only" />
                <span className="block rounded-[18px] border-2 border-pink-100 bg-white py-2.5 text-center text-sm font-extrabold text-zinc-700 transition peer-checked:border-transparent peer-checked:bg-brand peer-checked:text-white">
                  {new Date(iso).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={slots.length === 0}
        className="mt-5 w-full rounded-full py-3.5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:opacity-40"
        style={{
          backgroundColor: "var(--brand)",
          boxShadow: "0 12px 30px -8px color-mix(in srgb, var(--brand) 45%, transparent)",
        }}
      >
        تأكيد الموعد الجديد
      </button>
    </form>
  );
}
