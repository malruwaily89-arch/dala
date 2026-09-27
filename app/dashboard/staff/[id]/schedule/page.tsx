import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { startOfDay, endOfDay } from "@/lib/scheduling";
import { APPT_STATUS, formatDay, formatTime, formatSar } from "@/lib/utils";
import { ScheduleExportButton } from "./ScheduleExportButton";

export default async function StaffSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const staff = await db.staff.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!staff) notFound();

  const rangeStart = startOfDay(new Date());
  const rangeEnd = endOfDay(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000));

  const appointments = await db.appointment.findMany({
    where: {
      tenantId: user.tenantId,
      staffId: id,
      startsAt: { gte: rangeStart, lte: rangeEnd },
      status: { not: "cancelled" },
    },
    include: { customer: true, service: true },
    orderBy: { startsAt: "asc" },
  });

  const byDay = new Map<string, typeof appointments>();
  for (const appt of appointments) {
    const key = appt.startsAt.toDateString();
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(appt);
  }

  return (
    <div>
      <Link href="/dashboard/staff" className="text-sm font-semibold text-brand hover:underline">
        ← رجوع للموظفات
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">
            جدول {staff.name}
            {staff.jobTitle && <span className="text-lg font-semibold text-zinc-500"> — {staff.jobTitle}</span>}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">مواعيد الأسبوع القادم (7 أيام من اليوم).</p>
        </div>
        <ScheduleExportButton targetElementId="staff-schedule-table" fileName={`جدول-${staff.name}`} />
      </div>

      <div id="staff-schedule-table" className="mt-6 space-y-6 bg-white p-1">
        {appointments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
            لا مواعيد لهذه الموظفة خلال الأسبوع القادم.
          </div>
        ) : (
          Array.from(byDay.entries()).map(([dayKey, dayAppts]) => (
            <div key={dayKey} className="overflow-hidden rounded-xl border border-zinc-200">
              <div className="bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-700">
                {formatDay(dayAppts[0].startsAt)}
              </div>
              <table className="w-full text-start text-sm">
                <thead className="bg-zinc-50 text-xs font-bold text-zinc-500">
                  <tr>
                    <th className="p-3 text-start">الوقت</th>
                    <th className="p-3 text-start">العميلة</th>
                    <th className="p-3 text-start">الخدمة</th>
                    <th className="p-3 text-start">العربون</th>
                    <th className="p-3 text-start">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {dayAppts.map((appt) => {
                    const statusInfo = APPT_STATUS[appt.status] ?? { label: appt.status, color: "bg-zinc-100 text-zinc-600" };
                    return (
                      <tr key={appt.id} className={`border-t border-zinc-100 ${statusInfo.color}`}>
                        <td className="p-3 font-bold">{formatTime(appt.startsAt)}</td>
                        <td className="p-3">{appt.customer.name}</td>
                        <td className="p-3">{appt.service.name}</td>
                        <td className="p-3">{formatSar(appt.depositAmount)}</td>
                        <td className="p-3 font-bold">{statusInfo.label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
