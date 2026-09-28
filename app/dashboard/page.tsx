import { EmptyState } from "./ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  startOfDay,
  endOfDay,
  parseWorkingHours,
  buildDayTimeline,
  dayWorkWindow,
  type DayTimelineRow,
} from "@/lib/scheduling";
import { getStaffAvailabilityReport } from "@/app/actions/reports";
import { APPT_STATUS, formatSar, formatTime } from "@/lib/utils";
import {
  canCancelAppointments,
  canViewAppointmentStatus,
  canViewReportsAndFinance,
  canViewStaffSchedule,
  canAddAppointments,
} from "@/lib/permissions";
import {
  confirmDepositAction,
  completeAppointmentAction,
  noShowAction,
  cancelAppointmentAction,
  createAppointmentAdminAction,
} from "@/app/actions/appointments";

type Appt = Awaited<ReturnType<typeof loadTodayAppointments>>[number];
type Row = DayTimelineRow<Appt>;

async function loadTodayAppointments(tenantId: string) {
  return db.appointment.findMany({
    where: { tenantId, startsAt: { gte: startOfDay(new Date()), lt: endOfDay(new Date()) } },
    include: { customer: true, service: true, staff: true },
    orderBy: { startsAt: "asc" },
  });
}

export default async function TodayPage() {
  const user = await requireUser();

  const [appointments, staffList, customers, services, availability] = await Promise.all([
    loadTodayAppointments(user.tenantId),
    db.staff.findMany({ where: { tenantId: user.tenantId, isActive: true }, orderBy: { name: "asc" } }),
    db.customer.findMany({ where: { tenantId: user.tenantId }, orderBy: { name: "asc" } }),
    db.service.findMany({ where: { tenantId: user.tenantId, isActive: true }, orderBy: { name: "asc" } }),
    getStaffAvailabilityReport(),
  ]);

  const visibleStaff = staffList.filter((s) => canViewStaffSchedule(user, s.id));
  const availById = new Map(availability.rows.map((r) => [r.id, r]));
  const availableToday = visibleStaff.reduce((sum, s) => sum + (availById.get(s.id)?.availableToday ?? 0), 0);

  const apptsByStaff = new Map<string, Appt[]>();
  for (const a of appointments) {
    const list = apptsByStaff.get(a.staffId) ?? [];
    list.push(a);
    apptsByStaff.set(a.staffId, list);
  }

  const today = startOfDay(new Date());
  const canBook = canAddAppointments(user);

  const stats = {
    todayCount: appointments.length,
    pendingDeposits: appointments.filter((a) => a.status === "pending_deposit").length,
    confirmedCount: appointments.filter((a) => a.status === "confirmed").length,
    doneCount: appointments.filter((a) => a.status === "done").length,
    cancelledCount: appointments.filter((a) => a.status === "cancelled").length,
    noShowCount: appointments.filter((a) => a.status === "no_show").length,
    expectedRevenue: appointments
      .filter((a) => a.status !== "cancelled" && a.status !== "no_show")
      .reduce((sum, a) => sum + a.service.price, 0),
    todayRevenue: appointments
      .filter((a) => a.depositPaidAt)
      .reduce((sum, a) => sum + a.depositAmount, 0),
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold">يومك اليوم</h1>
      <p className="mt-1 text-sm text-zinc-500">نظرة سريعة على مواعيد اليوم ووضع العربونات.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="مواعيد اليوم" value={String(stats.todayCount)} />
        <StatCard label="مواعيد متاحة اليوم" value={String(availableToday)} className="border-brand-gold/30 bg-brand-gold/5" />
        <StatCard label="بانتظار العربون" value={String(stats.pendingDeposits)} highlight={stats.pendingDeposits > 0} />
        {canViewReportsAndFinance(user) && (
          <StatCard label="إيراد متوقع" value={formatSar(stats.expectedRevenue)} />
        )}
        {canViewReportsAndFinance(user) && (
          <StatCard label="إجمالي إيرادات اليوم" value={formatSar(stats.todayRevenue)} />
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="مؤكدة" value={stats.confirmedCount} className="border-emerald-200 bg-emerald-50 text-emerald-800" />
        <MiniStat label="مكتملة" value={stats.doneCount} className="border-sky-200 bg-sky-50 text-sky-800" />
        <MiniStat label="ملغاة" value={stats.cancelledCount} className="border-zinc-200 bg-zinc-50 text-zinc-600" />
        <MiniStat label="لم تحضر" value={stats.noShowCount} className="border-rose-200 bg-rose-50 text-rose-700" />
      </div>

      <h2 className="mt-10 text-lg font-bold">جدول اليوم حسب الموظفة</h2>
      <p className="mt-1 text-sm text-zinc-500">
        الأوقات الفارغة قابلة للضغط لحجز موعد فوري{!canBook && " (يلزم صلاحية إضافة المواعيد)"}.
      </p>

      {visibleStaff.length === 0 ? (
        <EmptyState text="لا موظفات نشطات بعد." />
      ) : (
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
          {visibleStaff.map((s) => {
            const hours = parseWorkingHours(s.workingHours);
            const isWorkingToday = hours.days.includes(today.getDay());
            const dayAppts = isWorkingToday
              ? (() => {
                  const { start, end } = dayWorkWindow(today, hours);
                  return appointments.filter((a) => a.staffId === s.id && a.startsAt >= start && a.startsAt < end);
                })()
              : [];
            const rows = isWorkingToday ? buildDayTimeline(today, hours, dayAppts) : [];

            return (
              <div key={s.id} className="w-72 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="border-b border-zinc-100 bg-zinc-50/60 px-4 py-3">
                  <p className="font-bold text-zinc-800">{s.name}</p>
                  <p className="text-xs text-zinc-500">{isWorkingToday ? `${hours.start} – ${hours.end}` : "إجازة اليوم"}</p>
                </div>
                <div className="max-h-[520px] space-y-2 overflow-y-auto p-3">
                  {!isWorkingToday ? (
                    <p className="py-6 text-center text-xs text-zinc-400">لا دوام لها اليوم.</p>
                  ) : (
                    rows.map((row, i) =>
                      row.kind === "appt" ? (
                        <ApptBlock key={row.appt.id} appt={row.appt} showStatus={canViewAppointmentStatus(user)} />
                      ) : (
                        <GapBlock
                          key={`gap-${i}`}
                          row={row}
                          staffId={s.id}
                          customers={customers}
                          services={services}
                          canBook={canBook}
                        />
                      )
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {appointments.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-bold">إجراءات سريعة على مواعيد اليوم</h2>
          <ul className="mt-4 space-y-3">
            {appointments.map((appt) => {
              const status = APPT_STATUS[appt.status] ?? { label: appt.status, color: "bg-zinc-100" };
              return (
                <li
                  key={appt.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <div className="w-20 shrink-0 text-center">
                    <p className="text-lg font-extrabold">{formatTime(appt.startsAt)}</p>
                    <p className="text-xs text-zinc-400">حتى {formatTime(appt.endsAt)}</p>
                  </div>
                  <div className="min-w-40 flex-1">
                    <p className="font-bold">
                      {appt.customer.name}{" "}
                      <span dir="ltr" className="text-xs font-normal text-zinc-400">
                        {appt.customer.phone}
                      </span>
                    </p>
                    <p className="text-sm text-zinc-600">
                      {appt.service.name} — مع {appt.staff.name} · {appt.bookingCode}
                    </p>
                  </div>
                  {canViewAppointmentStatus(user) && (
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.color}`}>{status.label}</span>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {appt.status === "pending_deposit" && (
                      <form action={confirmDepositAction}>
                        <input type="hidden" name="id" value={appt.id} />
                        <ActionBtn className="bg-emerald-600 text-white">تأكيد العربون</ActionBtn>
                      </form>
                    )}
                    {appt.status === "confirmed" && (
                      <>
                        <form action={completeAppointmentAction}>
                          <input type="hidden" name="id" value={appt.id} />
                          <ActionBtn className="bg-sky-600 text-white">مكتمل</ActionBtn>
                        </form>
                        <form action={noShowAction}>
                          <input type="hidden" name="id" value={appt.id} />
                          <ActionBtn className="border border-rose-300 text-rose-600">لم تحضر</ActionBtn>
                        </form>
                      </>
                    )}
                    {(appt.status === "pending_deposit" || appt.status === "confirmed") && canCancelAppointments(user) && (
                      <form action={cancelAppointmentAction}>
                        <input type="hidden" name="id" value={appt.id} />
                        <ActionBtn className="border border-zinc-300 text-zinc-500">إلغاء</ActionBtn>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="mt-10 rounded-xl border border-pink-200 bg-pink-50 p-5">
        <p className="font-bold text-brand">رابط الحجز العام لصالونك</p>
        <p dir="ltr" className="mt-1 font-mono text-sm text-zinc-700">
          /b/{user.tenant.slug}
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          ضعيه في بايو إنستغرام وواتساب — كل حجز جديد يظهر هنا تلقائياً.
        </p>
      </div>
    </div>
  );
}

function ApptBlock({ appt, showStatus }: { appt: Appt; showStatus: boolean }) {
  const status = APPT_STATUS[appt.status] ?? { label: appt.status, color: "bg-zinc-100 text-zinc-600" };
  return (
    <div className={`rounded-lg border border-zinc-100 p-2.5 text-xs ${status.color}`}>
      <div className="flex items-center justify-between font-bold">
        <span>
          {formatTime(appt.startsAt)} – {formatTime(appt.endsAt)}
        </span>
        {showStatus && <span>{status.label}</span>}
      </div>
      <p className="mt-0.5 truncate">{appt.customer.name} · {appt.service.name}</p>
    </div>
  );
}

function GapBlock({
  row,
  staffId,
  customers,
  services,
  canBook,
}: {
  row: Extract<Row, { kind: "gap" }>;
  staffId: string;
  customers: { id: string; name: string; phone: string }[];
  services: { id: string; name: string }[];
  canBook: boolean;
}) {
  const label = `${formatTime(row.start)} – ${formatTime(row.end)} · متاح`;
  if (!canBook) {
    return <div className="rounded-lg border border-dashed border-zinc-200 p-2.5 text-center text-xs text-zinc-400">{label}</div>;
  }
  return (
    <details className="group rounded-lg border border-dashed border-brand-gold/30 bg-brand-gold/5">
      <summary className="cursor-pointer list-none p-2.5 text-center text-xs font-bold text-brand-gold">{label}</summary>
      <form action={createAppointmentAdminAction} className="space-y-2 border-t border-brand-gold/20 p-2.5">
        <input type="hidden" name="staffId" value={staffId} />
        <input type="hidden" name="slotIso" value={row.start.toISOString()} />
        <select
          name="customerId"
          required
          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs focus:border-brand focus:outline-none"
        >
          <option value="">العميلة...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.phone})
            </option>
          ))}
        </select>
        <select
          name="serviceId"
          required
          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs focus:border-brand focus:outline-none"
        >
          <option value="">الخدمة...</option>
          {services.map((sv) => (
            <option key={sv.id} value={sv.id}>
              {sv.name}
            </option>
          ))}
        </select>
        <button className="w-full rounded-full bg-brand py-1.5 text-xs font-bold text-white hover:opacity-90">
          احجزي الآن
        </button>
      </form>
    </details>
  );
}

function StatCard({
  label,
  value,
  highlight,
  className = "",
}: {
  label: string;
  value: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        highlight ? "border-amber-300 bg-amber-50" : className || "border-zinc-200 bg-white"
      }`}
    >
      <p className="text-sm font-semibold text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, className = "" }: { label: string; value: number; className?: string }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${className}`}>
      <p className="text-xl font-extrabold">{value}</p>
      <p className="text-xs font-semibold opacity-80">{label}</p>
    </div>
  );
}

function ActionBtn({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <button className={`rounded-full px-4 py-2 text-xs font-bold transition hover:opacity-85 ${className}`}>
      {children}
    </button>
  );
}
