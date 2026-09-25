import { EmptyState } from "./ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { startOfDay, endOfDay } from "@/lib/scheduling";
import { APPT_STATUS, formatSar, formatTime } from "@/lib/utils";
import {
  confirmDepositAction,
  completeAppointmentAction,
  noShowAction,
  cancelAppointmentAction,
} from "@/app/actions/appointments";

export default async function TodayPage() {
  const user = await requireUser();

  const appointments = await db.appointment.findMany({
    where: { tenantId: user.tenantId, startsAt: { gte: startOfDay(new Date()), lt: endOfDay(new Date()) } },
    include: { customer: true, service: true, staff: true },
    orderBy: { startsAt: "asc" },
  });

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
        <StatCard label="بانتظار العربون" value={String(stats.pendingDeposits)} highlight={stats.pendingDeposits > 0} />
        <StatCard label="إيراد متوقع" value={formatSar(stats.expectedRevenue)} />
        <StatCard label="إجمالي إيرادات اليوم" value={formatSar(stats.todayRevenue)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="مؤكدة" value={stats.confirmedCount} className="border-emerald-200 bg-emerald-50 text-emerald-800" />
        <MiniStat label="مكتملة" value={stats.doneCount} className="border-sky-200 bg-sky-50 text-sky-800" />
        <MiniStat label="ملغاة" value={stats.cancelledCount} className="border-zinc-200 bg-zinc-50 text-zinc-600" />
        <MiniStat label="لم تحضر" value={stats.noShowCount} className="border-rose-200 bg-rose-50 text-rose-700" />
      </div>

      <h2 className="mt-10 text-lg font-bold">جدول اليوم</h2>
      {appointments.length === 0 ? (
        <EmptyState text="لا مواعيد اليوم — جرّبي مشاركة رابط الحجز لزيادة الحجوزات." />
      ) : (
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
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.color}`}>
                  {status.label}
                </span>
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
                  {(appt.status === "pending_deposit" || appt.status === "confirmed") && (
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

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        highlight ? "border-amber-300 bg-amber-50" : "border-zinc-200 bg-white"
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
