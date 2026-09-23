"use client";

import { useEffect, useState, useTransition } from "react";
import { fetchSlotsAction } from "./fetch-slots";

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function PublicBookingSlots({ tenantId, days }: { tenantId: string; days: Date[] }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [slots, setSlots] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function currentSelection() {
    const form = document.querySelector("form");
    const service = form?.querySelector<HTMLInputElement>('input[name="serviceId"]:checked')?.value;
    const staff = form?.querySelector<HTMLInputElement>('input[name="staffId"]:checked')?.value;
    return { serviceId: service, staffId: staff };
  }

  function loadSlots(dayIndex: number) {
    startTransition(async () => {
      const { serviceId, staffId } = currentSelection();
      if (!serviceId || !staffId) {
        setSlots([]);
        return;
      }
      const result = await fetchSlotsAction({
        tenantId,
        staffId,
        serviceId,
        dateIso: days[dayIndex].toISOString(),
      });
      setSlots(result);
    });
  }

  useEffect(() => {
    // الاشتراك في تغييرات النموذج (خارج React) ثم التحميل داخل transition
    const handler = () => loadSlots(selectedDay);
    document.addEventListener("change", handler);
    const timer = setTimeout(() => loadSlots(selectedDay), 0);
    return () => {
      document.removeEventListener("change", handler);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-bold">3. اختاري اليوم والوقت</h2>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {days.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelectedDay(i)}
            className={`shrink-0 rounded-xl border px-4 py-2.5 text-center text-xs font-bold transition ${
              selectedDay === i
                ? "border-brand bg-brand text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
            }`}
          >
            <span className="block">{DAY_NAMES[d.getDay()]}</span>
            <span className="block font-normal">{d.getDate()}</span>
          </button>
        ))}
      </div>

      {pending ? (
        <p className="mt-4 text-sm text-zinc-400">جارٍ البحث عن المواعيد المتاحة…</p>
      ) : slots.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">لا مواعيد متاحة هذا اليوم — جرّبي يوماً آخر.</p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {slots.map((iso) => (
            <label key={iso} className="cursor-pointer">
              <input type="radio" name="slotIso" value={iso} required className="peer hidden" />
              <span className="block rounded-lg border border-zinc-200 py-2 text-center text-sm font-bold text-zinc-700 transition peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white">
                {new Date(iso).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
