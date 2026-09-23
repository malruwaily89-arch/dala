import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseWorkingHours } from "@/lib/scheduling";
import { createStaffAction, toggleStaffAction } from "@/app/actions/appointments";
import { EmptyState, Banner } from "../ui";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

  const staff = await db.staff.findMany({
    where: { tenantId: user.tenantId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  return (
    <div>
      <h1 className="text-2xl font-extrabold">الموظفات</h1>
      <p className="mt-1 text-sm text-zinc-500">
        ساعات عمل كل موظفة تحدد المواعيد المتاحة في صفحة الحجز.
      </p>

      {error && <Banner>{error}</Banner>}

      <details className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer font-bold text-brand">+ موظفة جديدة</summary>
        <form action={createStaffAction} className="mt-4 flex flex-wrap items-end gap-3">
          <Field name="name" label="الاسم" type="text" />
          <Field name="phone" label="الجوال (اختياري)" type="tel" />
          <Field name="workStart" label="من" type="time" />
          <Field name="workEnd" label="إلى" type="time" />
          <button className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:opacity-90">
            حفظ
          </button>
        </form>
      </details>

      {staff.length === 0 ? (
        <EmptyState text="أضيفي أول موظفة لتفعيل الحجوزات." />
      ) : (
        <ul className="mt-4 space-y-3">
          {staff.map((s) => {
            const hours = parseWorkingHours(s.workingHours);
            return (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-56 flex-1">
                  <p className="font-bold">{s.name}</p>
                  <p className="text-sm text-zinc-600">
                    {hours.start} — {hours.end} ·{" "}
                    {hours.days.map((d) => DAY_NAMES[d]).join("، ")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {s.isActive ? "على رأس العمل" : "موقوفة"}
                </span>
                <form action={toggleStaffAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50">
                    {s.isActive ? "إيقاف" : "تفعيل"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Field({ name, label, type }: { name: string; label: string; type: string }) {
  return (
    <label className="block flex-1">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        dir={type === "tel" ? "ltr" : undefined}
        required={type !== "tel"}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
      />
    </label>
  );
}
