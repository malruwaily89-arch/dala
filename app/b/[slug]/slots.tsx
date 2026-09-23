"use client";

import { useEffect, useState, useTransition } from "react";
import { fetchSlotsAction } from "./fetch-slots";

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/** الأوقات داخل بطاقة "٣" — البطاقة والعنوان يرسمهما page.tsx */
export function PublicBookingSlots({ tenantId, days }: { tenantId: string; days: Date[] }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [pending, startTransition] = useTransition();

  function currentSelection() {
    const form = document.querySelector("form");
    const service = form?.querySelector<HTMLInputElement>('input[name="serviceId"]:checked')?.value;
    const staff = form?.querySelector<HTMLInputElement>('input[name="staffId"]:checked')?.value;
    return { serviceId: service, staffId: staff };
  }

  function loadSlots(dayIndex: number) {
    startTransition(async () => {
      setLoadError(false);
      const { serviceId, staffId } = currentSelection();
      if (!serviceId || !staffId) {
        setSlots([]);
        return;
      }
      try {
        const result = await fetchSlotsAction({
          tenantId,
          staffId,
          serviceId,
          dateIso: days[dayIndex].toISOString(),
        });
        setSlots(result);
      } catch {
        // فشل التحديث (انقطاع/مراجع قديمة) لا ينهار التطبيق — تعرض رسالة ودّية
        setSlots([]);
        setLoadError(true);
      }
    });
  }

  useEffect(() => {
    // أعد التحميل فقط عند تغيير الخدمة أو الموظفة — وليس عند اختيار الوقت
    const handler = (e: Event) => {
      const t = e.target as HTMLInputElement | null;
      if (t && (t.name === "serviceId" || t.name === "staffId")) loadSlots(selectedDay);
    };
    document.addEventListener("change", handler);
    const timer = setTimeout(() => loadSlots(selectedDay), 0);
    return () => {
      document.removeEventListener("change", handler);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  return (
    <div>
      {/* شريط الأيام */}
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

      {/* الأوقات */}
      <div className="mt-5 min-h-24">
        {pending ? (
          <p className="text-sm text-zinc-400">جارٍ البحث عن أجمل الأوقات المتاحة…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {loadError
              ? "تعذر جلب المواعيد — أعيدي المحاولة بتغيير اليوم أو الخدمة."
              : "لا مواعيد متاحة هذا اليوم — جرّبي يوماً آخر."}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {slots.map((iso) => (
              <label key={iso} className="cursor-pointer">
                <input type="radio" name="slotIso" value={iso} required className="peer sr-only" />
                <span
                  className="block rounded-[18px] border-2 border-pink-100 bg-white py-2.5 text-center text-sm font-extrabold text-zinc-700 transition peer-checked:border-transparent peer-checked:bg-brand peer-checked:text-white"
                >
                  {new Date(iso).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
