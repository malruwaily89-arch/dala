"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { fetchAdminSlotsAction } from "@/app/actions/appointments";

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function daysAhead(n: number): Date[] {
  return Array.from({ length: n }, (_, i) => new Date(Date.now() + i * 24 * 60 * 60 * 1000));
}

/** يقرأ الموظفة/الخدمة المختارة حالياً من نفس الفورم — يُحدَّث تلقائياً عند تغييرهما */
function readSelection() {
  const form = document.querySelector<HTMLFormElement>("form[data-admin-booking]");
  return {
    staffId: form?.querySelector<HTMLSelectElement>('select[name="staffId"]')?.value ?? "",
    serviceId: form?.querySelector<HTMLSelectElement>('select[name="serviceId"]')?.value ?? "",
  };
}

export function AdminSlotPicker() {
  const days = daysAhead(7);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [slotsByDay, setSlotsByDay] = useState<Record<number, string[] | undefined>>({});
  const [loadingDay, setLoadingDay] = useState<number | null>(null);

  async function loadDay(dayIndex: number) {
    const { staffId, serviceId } = readSelection();
    if (!staffId || !serviceId) return;
    setLoadingDay(dayIndex);
    try {
      const result = await fetchAdminSlotsAction({ staffId, serviceId, dateIso: days[dayIndex].toISOString() });
      setSlotsByDay((prev) => ({ ...prev, [dayIndex]: result }));
    } catch {
      setSlotsByDay((prev) => ({ ...prev, [dayIndex]: [] }));
    } finally {
      setLoadingDay(null);
    }
  }

  useEffect(() => {
    const handler = (e: Event) => {
      const t = e.target as HTMLSelectElement | null;
      if (t && (t.name === "staffId" || t.name === "serviceId")) {
        setSlotsByDay({});
        setSelectedIso(null);
      }
    };
    document.addEventListener("change", handler);
    return () => document.removeEventListener("change", handler);
  }, []);

  return (
    <div className="sm:col-span-2">
      <span className="mb-1.5 block text-sm font-semibold">وقت الموعد</span>
      <input type="hidden" name="slotIso" value={selectedIso ?? ""} required />
      <div className="space-y-2">
        {days.map((day, i) => {
          const slots = slotsByDay[i];
          return (
            <details
              key={i}
              className="group overflow-hidden rounded-xl border border-zinc-200 bg-white"
              onToggle={(e) => {
                if ((e.currentTarget as HTMLDetailsElement).open && slots === undefined) loadDay(i);
              }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 select-none">
                <span className="text-sm font-bold text-zinc-700">
                  {DAY_NAMES[day.getDay()]} {day.getDate()}
                </span>
                <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-zinc-100 p-3">
                {loadingDay === i ? (
                  <p className="text-xs text-zinc-400">جارٍ التحميل…</p>
                ) : !slots || slots.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    {slots === undefined ? "اختاري الموظفة والخدمة أولاً." : "لا أوقات متاحة هذا اليوم."}
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {slots.map((iso) => (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => setSelectedIso(iso)}
                        className={`rounded-lg border-2 py-2 text-xs font-bold transition ${
                          selectedIso === iso
                            ? "border-transparent bg-brand text-white"
                            : "border-zinc-200 text-zinc-700 hover:border-brand/40"
                        }`}
                      >
                        {new Date(iso).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
