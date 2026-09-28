import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, Clock } from "lucide-react";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { startOfDay, endOfDay, parseWorkingHours, buildDayTimeline, type DayTimelineRow } from "@/lib/scheduling";
import { canViewStaffSchedule } from "@/lib/permissions";
import { APPT_STATUS, formatDay, formatTime, formatSar } from "@/lib/utils";
import { ScheduleExportButton } from "./ScheduleExportButton";

type Appt = Prisma.AppointmentGetPayload<{ include: { customer: true; service: true } }>;
type Row = DayTimelineRow<Appt>;

function DayAccordion({ day, rows, defaultOpen }: { day: Date; rows: Row[]; defaultOpen: boolean }) {
  const bookedCount = rows.filter((r) => r.kind === "appt").length;
  const availableCount = rows
    .filter((r): r is Extract<Row, { kind: "gap" }> => r.kind === "gap")
    .reduce((sum, r) => sum + Math.floor((r.end.getTime() - r.start.getTime()) / (30 * 60_000)), 0);

  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-2xl border border-brand-gold/25 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition open:shadow-md"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-gradient-to-l from-brand/[0.06] via-transparent to-brand-gold/[0.08] px-5 py-4 select-none">
        <div className="flex items-center gap-3">
          <ChevronDown className="h-4 w-4 shrink-0 text-brand-gold transition-transform duration-200 group-open:rotate-180" />
          <span className="font-serif text-base font-bold text-zinc-800">{formatDay(day)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            {bookedCount} محجوز
          </span>
          <span className="rounded-full bg-brand-gold/10 px-3 py-1 text-xs font-bold text-brand-gold">
            {availableCount} متاح
          </span>
        </div>
      </summary>

      <div className="border-t border-zinc-100">
        <table className="w-full text-start text-sm">
          <thead className="bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="p-3 text-start">الوقت</th>
              <th className="p-3 text-start">العميلة</th>
              <th className="p-3 text-start">الخدمة</th>
              <th className="p-3 text-start">العربون</th>
              <th className="p-3 text-start">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <ScheduleRow key={row.kind === "appt" ? row.appt.id : `gap-${i}`} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function ScheduleRow({ row }: { row: Row }) {
  if (row.kind === "gap") {
    return (
      <tr className="border-t border-zinc-100/80">
        <td className="p-3 font-semibold text-zinc-400">
          {formatTime(row.start)} – {formatTime(row.end)}
        </td>
        <td className="p-3 text-zinc-300">—</td>
        <td className="p-3 text-zinc-300">—</td>
        <td className="p-3 text-zinc-300">—</td>
        <td className="p-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-gold/80">
            <Clock className="h-3.5 w-3.5" />
            الحجز متاح
          </span>
        </td>
      </tr>
    );
  }
  const statusInfo = APPT_STATUS[row.appt.status] ?? { label: row.appt.status, color: "bg-zinc-100 text-zinc-600" };
  return (
    <tr className="border-t border-zinc-100/80">
      <td className="p-3 font-bold text-zinc-800">
        {formatTime(row.appt.startsAt)} – {formatTime(row.appt.endsAt)}
      </td>
      <td className="p-3 text-zinc-700">{row.appt.customer.name}</td>
      <td className="p-3 text-zinc-600">{row.appt.service.name}</td>
      <td className="p-3 text-zinc-600">{formatSar(row.appt.depositAmount)}</td>
      <td className="p-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
      </td>
    </tr>
  );
}

export default async function StaffSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const staff = await db.staff.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!staff) notFound();
  if (!canViewStaffSchedule(user, id)) notFound();

  const hours = parseWorkingHours(staff.workingHours);

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

  const byDay = new Map<string, Appt[]>();
  for (const appt of appointments) {
    const key = appt.startsAt.toDateString();
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(appt);
  }

  const workDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = startOfDay(new Date(Date.now() + i * 24 * 60 * 60 * 1000));
    if (hours.days.includes(day.getDay())) workDays.push(day);
  }

  return (
    <div>
      <Link href="/dashboard/staff" className="text-sm font-semibold text-brand hover:underline">
        ← رجوع للموظفات
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-brand-gold/25 bg-gradient-to-l from-brand/[0.04] to-brand-gold/[0.08] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-extrabold text-zinc-900">
              جدول {staff.name}
              {staff.jobTitle && <span className="text-lg font-semibold text-zinc-500"> — {staff.jobTitle}</span>}
            </h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500">
              <Clock className="h-3.5 w-3.5 text-brand-gold" />
              ساعات العمل {hours.start} – {hours.end} · الأسبوع القادم
            </p>
          </div>
          <ScheduleExportButton targetElementId="staff-schedule-table" fileName={`جدول-${staff.name}`} />
        </div>
      </div>

      <div id="staff-schedule-table" className="mt-6 space-y-4 bg-white">
        {workDays.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
            لا أيام عمل محددة لهذه الموظفة خلال الأسبوع القادم.
          </div>
        ) : (
          workDays.map((day) => {
            const dayAppts = byDay.get(day.toDateString()) ?? [];
            const rows = buildDayTimeline(day, hours, dayAppts);
            return <DayAccordion key={day.toDateString()} day={day} rows={rows} defaultOpen={false} />;
          })
        )}
      </div>
    </div>
  );
}
