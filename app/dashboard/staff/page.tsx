import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseWorkingHours } from "@/lib/scheduling";
import { createStaffAction, toggleStaffAction, updateStaffScheduleAction } from "@/app/actions/appointments";
import { getStaffPerformanceReport } from "@/app/actions/reports";
import { formatSar } from "@/lib/utils";
import { canManageStaffSchedules, canViewReportsAndFinance, isStaffAccount } from "@/lib/permissions";
import { EmptyState, Banner } from "../ui";
import { CreateStaffLoginForm, EditStaffPermissionsForm } from "./StaffAccountForm";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "يرجى تعبئة جميع الحقول المطلوبة.",
  forbidden: "ليس لديك صلاحية لهذا الإجراء — راجعي المالكة.",
  password: "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
  exists: "هذا البريد الإلكتروني مستخدم مسبقاً.",
};

const PERFORMANCE_LABEL: Record<string, { label: string; className: string }> = {
  busy: { label: "مشغولة جداً", className: "bg-rose-100 text-rose-700" },
  active: { label: "نشطة", className: "bg-emerald-100 text-emerald-700" },
  quiet: { label: "هادئة", className: "bg-zinc-100 text-zinc-500" },
};

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const user = await requireUser();
  const { error, ok } = await searchParams;

  const [staff, performance] = await Promise.all([
    db.staff.findMany({
      where: { tenantId: user.tenantId },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: { loginUser: true },
    }),
    getStaffPerformanceReport(),
  ]);
  const perfById = new Map(performance.rows.map((r) => [r.id, r]));

  return (
    <div>
      <h1 className="text-2xl font-extrabold">الموظفات</h1>
      <p className="mt-1 text-sm text-zinc-500">
        ساعات وأيام عمل كل موظفة تحدد المواعيد المتاحة في صفحة الحجز.
      </p>

      {error && <Banner>{ERROR_MESSAGES[error] ?? error}</Banner>}
      {ok && <Banner success>تم تنفيذ الإجراء بنجاح.</Banner>}

      {canManageStaffSchedules(user) && (
        <details className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer font-bold text-brand">+ موظفة جديدة</summary>
          <form action={createStaffAction} className="mt-4 space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <Field name="name" label="الاسم" type="text" />
              <Field name="jobTitle" label="المسمى الوظيفي (اختياري)" type="text" optional />
              <Field name="phone" label="الجوال (اختياري)" type="tel" />
              <Field name="workStart" label="من" type="time" defaultValue="00:00" />
              <Field name="workEnd" label="إلى" type="time" defaultValue="23:59" />
            </div>
            <DaysPicker defaultDays={[0, 1, 2, 3, 4, 5, 6]} />
            <button className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:opacity-90">
              حفظ
            </button>
          </form>
        </details>
      )}

      {staff.length === 0 ? (
        <EmptyState text="أضيفي أول موظفة لتفعيل الحجوزات." />
      ) : (
        <ul className="mt-4 space-y-3">
          {staff.map((s) => {
            const hours = parseWorkingHours(s.workingHours);
            const perf = perfById.get(s.id);
            const perfInfo = perf ? PERFORMANCE_LABEL[perf.performanceLevel] : null;
            return (
              <li
                key={s.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="min-w-56 flex-1">
                    <p className="font-bold">
                      {s.name}
                      {s.jobTitle && <span className="ms-2 text-xs font-semibold text-brand/60">— {s.jobTitle}</span>}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {hours.start} — {hours.end} ·{" "}
                      {hours.days.map((d) => DAY_NAMES[d]).join("، ")}
                    </p>
                  </div>
                  {perfInfo && (
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${perfInfo.className}`}>
                      {perfInfo.label}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {s.isActive ? "على رأس العمل" : "موقوفة"}
                  </span>
                  <Link
                    href={`/dashboard/staff/${s.id}/schedule`}
                    className="rounded-full border border-brand/20 bg-brand/5 px-4 py-2 text-xs font-bold text-brand hover:bg-brand/10"
                  >
                    الجدول
                  </Link>
                  <form action={toggleStaffAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50">
                      {s.isActive ? "إيقاف" : "تفعيل"}
                    </button>
                  </form>
                </div>

                {canManageStaffSchedules(user) && (
                  <details className="mt-3 border-t border-zinc-100 pt-3">
                    <summary className="cursor-pointer text-xs font-bold text-brand">تعديل ساعات وأيام العمل</summary>
                    <form action={updateStaffScheduleAction} className="mt-3 space-y-3">
                      <input type="hidden" name="id" value={s.id} />
                      <div className="flex flex-wrap items-end gap-3">
                        <Field name="workStart" label="من" type="time" defaultValue={hours.start} />
                        <Field name="workEnd" label="إلى" type="time" defaultValue={hours.end} />
                      </div>
                      <DaysPicker defaultDays={hours.days} />
                      <button className="rounded-full bg-zinc-800 px-5 py-2 text-xs font-bold text-white hover:opacity-90">
                        حفظ التعديل
                      </button>
                    </form>
                  </details>
                )}

                {!isStaffAccount(user) && (
                  <details className="mt-3 border-t border-zinc-100 pt-3">
                    <summary className="cursor-pointer text-xs font-bold text-brand">
                      حساب الدخول والصلاحيات {s.loginUser ? "(مفعّل)" : "(غير مُنشأ)"}
                    </summary>
                    <div className="mt-3">
                      {s.loginUser ? (
                        <EditStaffPermissionsForm
                          userId={s.loginUser.id}
                          email={s.loginUser.email}
                          permissions={{
                            canCancelAppointments: s.loginUser.canCancelAppointments,
                            canAddAppointments: s.loginUser.canAddAppointments,
                            canViewAppointmentStatus: s.loginUser.canViewAppointmentStatus,
                            canManageStaffSchedules: s.loginUser.canManageStaffSchedules,
                          }}
                        />
                      ) : (
                        <CreateStaffLoginForm staffId={s.id} />
                      )}
                    </div>
                  </details>
                )}

                {canViewReportsAndFinance(user) && perf && (
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 sm:grid-cols-4">
                    <MetricBox label="مواعيد اليوم" value={String(perf.todayCount)} />
                    <MetricBox label="مواعيد الشهر" value={String(perf.monthCount)} />
                    <MetricBox label="محصّل اليوم" value={formatSar(perf.collectedToday)} />
                    <MetricBox label="محصّل هذا الشهر" value={formatSar(perf.collectedMonthTotal)} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {staff.length > 0 && canViewReportsAndFinance(user) && (
        <>
          <h2 className="mt-10 text-lg font-bold">ملخص المبالغ المحصّلة لكل موظفة</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-start text-sm">
              <thead className="bg-zinc-50 text-xs font-bold text-zinc-500">
                <tr>
                  <th className="p-4 text-start">الموظفة</th>
                  <th className="p-4 text-start">مواعيد اليوم</th>
                  <th className="p-4 text-start">محصّل اليوم</th>
                  <th className="p-4 text-start">مواعيد الشهر</th>
                  <th className="p-4 text-start">محصّل الشهر</th>
                  <th className="p-4 text-start">الأداء</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => {
                  const perf = perfById.get(s.id);
                  const perfInfo = perf ? PERFORMANCE_LABEL[perf.performanceLevel] : null;
                  return (
                    <tr key={s.id} className="border-t border-zinc-100">
                      <td className="p-4 font-bold">{s.name}</td>
                      <td className="p-4 text-zinc-600">{perf?.todayCount ?? 0}</td>
                      <td className="p-4 text-zinc-600">{formatSar(perf?.collectedToday ?? 0)}</td>
                      <td className="p-4 text-zinc-600">{perf?.monthCount ?? 0}</td>
                      <td className="p-4 font-semibold text-zinc-800">
                        {formatSar(perf?.collectedMonthTotal ?? 0)}
                      </td>
                      <td className="p-4">
                        {perfInfo && (
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${perfInfo.className}`}>
                            {perfInfo.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2 text-center">
      <p className="text-sm font-extrabold text-zinc-800">{value}</p>
      <p className="text-[11px] font-semibold text-zinc-500">{label}</p>
    </div>
  );
}

function Field({
  name,
  label,
  type,
  defaultValue,
  optional = false,
}: {
  name: string;
  label: string;
  type: string;
  defaultValue?: string;
  optional?: boolean;
}) {
  return (
    <label className="block flex-1">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        dir={type === "tel" ? "ltr" : undefined}
        required={!optional && type !== "tel"}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
      />
    </label>
  );
}

function DaysPicker({ defaultDays }: { defaultDays: number[] }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold">أيام العمل</span>
      <div className="flex flex-wrap gap-2">
        {DAY_NAMES.map((label, day) => (
          <label
            key={day}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand/5 has-[:checked]:font-bold has-[:checked]:text-brand"
          >
            <input
              type="checkbox"
              name="day"
              value={day}
              defaultChecked={defaultDays.includes(day)}
              className="accent-brand"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
