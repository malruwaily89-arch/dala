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
import { APPT_STATUS, formatSar, formatTime, moneyToNumber } from "@/lib/utils";
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

  const availById = new Map(availability.rows.map((r) => [r.id, r]));
  // فقط الموظفات اللي عندهن وقت متاح فعلياً الآن — لا من إجازة اليوم ولا اللي حجزها كامل
  const visibleStaff = staffList.filter(
    (s) => canViewStaffSchedule(user, s.id) && (availById.get(s.id)?.availableToday ?? 0) > 0
  );
  const availableToday = visibleStaff.reduce((sum, s) => sum + (availById.get(s.id)?.availableToday ?? 0), 0);

  // حساب موظفة مقيّدة (تشوف جدولها فقط) ما يشوف إحصائيات أو إجراءات على مواعيد زميلاتها
  const visibleAppointments = appointments.filter((a) => canViewStaffSchedule(user, a.staffId));

  const today = startOfDay(new Date());
  const now = new Date();
  const canBook = canAddAppointments(user);

  const stats = {
    // "ملغاة" لها ميني-ستات خاص بها تحت — لا تُحتسب ضمن "مواعيد اليوم" نفسها
    todayCount: visibleAppointments.filter((a) => a.status !== "cancelled").length,
    pendingDeposits: visibleAppointments.filter((a) => a.status === "pending_deposit").length,
    confirmedCount: visibleAppointments.filter((a) => a.status === "confirmed").length,
    doneCount: visibleAppointments.filter((a) => a.status === "done").length,
    cancelledCount: visibleAppointments.filter((a) => a.status === "cancelled").length,
    noShowCount: visibleAppointments.filter((a) => a.status === "no_show").length,
    expectedRevenue: visibleAppointments
      .filter((a) => a.status !== "cancelled" && a.status !== "no_show")
      .reduce((sum, a) => sum + moneyToNumber(a.service.price), 0),
    todayRevenue: visibleAppointments
      .filter((a) => a.status !== "cancelled" && a.depositPaidAt)
      .reduce((sum, a) => sum + moneyToNumber(a.depositAmount), 0),
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-extrabold text-brand">يومك اليوم</h1>
      <p className="mt-1 text-sm text-foreground/55">نظرة سريعة على مواعيد اليوم ووضع العربونات.</p>

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
        <MiniStat label="ملغاة" value={stats.cancelledCount} className="border-brand/10 bg-background text-foreground/65" />
        <MiniStat label="لم تحضر" value={stats.noShowCount} className="border-rose-200 bg-rose-50 text-rose-700" />
      </div>

      <h2 className="mt-10 text-lg font-bold">مواعيد متاحة</h2>
      <p className="mt-1 text-sm text-foreground/55">
        فقط الموظفات اللي عندهن وقت متاح الآن — الأوقات الفارغة قابلة للضغط لحجز موعد فوري
        {!canBook && " (يلزم صلاحية إضافة المواعيد)"}.
      </p>

      {visibleStaff.length === 0 ? (
        <EmptyState text="لا مواعيد متاحة الآن — كل الموظفات إما بإجازة اليوم أو جدولهن مكتمل." />
      ) : (
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
          {visibleStaff.map((s) => {
            const hours = parseWorkingHours(s.workingHours);
            const { start, end } = dayWorkWindow(today, hours);
            const dayAppts = visibleAppointments.filter(
              (a) => a.staffId === s.id && a.status !== "cancelled" && a.startsAt >= start && a.startsAt < end
            );
            const rows = buildDayTimeline(today, hours, dayAppts);

            return (
              <div key={s.id} className="w-72 shrink-0 overflow-hidden rounded-[26px] border border-brand/10 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
                <div className="border-b border-brand-gold/15 bg-gradient-to-l from-brand/[0.05] to-brand-gold/[0.07] px-4 py-3.5">
                  <p className="font-bold text-zinc-800">{s.name}</p>
                  <p className="text-xs text-foreground/55">{hours.start} – {hours.end}</p>
                </div>
                <div className="max-h-[520px] space-y-2 overflow-y-auto p-3">
                  {rows.map((row, i) =>
                    row.kind === "appt" ? (
                      <ApptBlock key={row.appt.id} appt={row.appt} showStatus={canViewAppointmentStatus(user)} />
                    ) : (
                      <GapBlock
                        key={`gap-${i}`}
                        row={row}
                        now={now}
                        staffId={s.id}
                        customers={customers}
                        services={services}
                        canBook={canBook}
                      />
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {visibleAppointments.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-bold">إجراءات سريعة على مواعيد اليوم</h2>
          <ul className="mt-4 space-y-3">
            {visibleAppointments.map((appt) => {
              const status = APPT_STATUS[appt.status] ?? { label: appt.status, color: "bg-zinc-100" };
              return (
                <li
                  key={appt.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-brand/10 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
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
                    <p className="text-sm text-foreground/65">
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
                        <ActionBtn className="border border-zinc-300 text-foreground/55">إلغاء</ActionBtn>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="mt-10 rounded-[24px] border border-brand-gold/25 bg-gradient-to-br from-brand/[0.05] to-brand-gold/[0.09] p-6 shadow-sm">
        <p className="font-serif font-bold text-brand">رابط الحجز العام لصالونك</p>
        <p dir="ltr" className="mt-1.5 inline-block rounded-lg bg-white/70 px-3 py-1.5 font-mono text-sm text-foreground/75 shadow-sm">
          /b/{user.tenant.slug}
        </p>
        <p className="mt-2 text-sm text-foreground/65">
          ضعيه في بايو إنستغرام وواتساب — كل حجز جديد يظهر هنا تلقائياً.
        </p>
      </div>
    </div>
  );
}

function ApptBlock({ appt, showStatus }: { appt: Appt; showStatus: boolean }) {
  const status = APPT_STATUS[appt.status] ?? { label: appt.status, color: "bg-zinc-100 text-foreground/65" };
  return (
    <div className={`rounded-lg border border-brand/10 p-2.5 text-xs ${status.color}`}>
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
  now,
  staffId,
  customers,
  services,
  canBook,
}: {
  row: Extract<Row, { kind: "gap" }>;
  now: Date;
  staffId: string;
  customers: { id: string; name: string; phone: string }[];
  services: { id: string; name: string }[];
  canBook: boolean;
}) {
  // فراغ العرض (buildDayTimeline) لا يستثني الماضي — نقصّ بداية الحجز الفعلي على "الآن" هنا
  const bookableStart = row.start > now ? row.start : now;
  if (bookableStart >= row.end) return null; // الفراغ بالكامل مضى وقته، ما فيه شي يُحجز

  const label = `${formatTime(bookableStart)} – ${formatTime(row.end)} · متاح`;
  if (!canBook) {
    return <div className="rounded-lg border border-dashed border-brand/10 p-2.5 text-center text-xs text-zinc-400">{label}</div>;
  }
  return (
    <details className="group rounded-lg border border-dashed border-brand-gold/30 bg-brand-gold/5">
      <summary className="cursor-pointer list-none p-2.5 text-center text-xs font-bold text-brand-gold">{label}</summary>
      <form action={createAppointmentAdminAction} className="space-y-2 border-t border-brand-gold/20 p-2.5">
        <input type="hidden" name="staffId" value={staffId} />
        <input type="hidden" name="slotIso" value={bookableStart.toISOString()} />
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
      className={`rounded-[22px] border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
        highlight ? "border-amber-300 bg-amber-50" : className || "border-brand/10 bg-white"
      }`}
    >
      <p className="text-sm font-semibold text-foreground/55">{label}</p>
      <p className="mt-1 font-serif text-2xl font-extrabold text-zinc-900">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, className = "" }: { label: string; value: number; className?: string }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-center shadow-sm transition-transform duration-300 hover:-translate-y-0.5 ${className}`}>
      <p className="font-serif text-xl font-extrabold">{value}</p>
      <p className="text-xs font-semibold opacity-80">{label}</p>
    </div>
  );
}

function ActionBtn({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <button className={`rounded-full px-4 py-2 text-xs font-bold shadow-sm transition-all duration-300 hover:-translate-y-px hover:opacity-90 hover:shadow ${className}`}>
      {children}
    </button>
  );
}
