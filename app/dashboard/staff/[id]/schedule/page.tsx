import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  startOfDay,
  endOfDay,
  parseWorkingHours,
  buildDayTimeline,
  dayWorkWindow,
  countAvailableSlotsForDay,
  type DayTimelineRow,
  type WorkingHours,
} from "@/lib/scheduling";
import { canViewStaffSchedule } from "@/lib/permissions";
import { APPT_STATUS, formatDay, formatTime, formatSar } from "@/lib/utils";
import { ScheduleExportButton } from "./ScheduleExportButton";

type Appt = Prisma.AppointmentGetPayload<{ include: { customer: true; service: true } }>;
type Row = DayTimelineRow<Appt>;

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

type CellTier = "off" | "quiet" | "partial" | "full";

const TIER_DOT: Record<CellTier, string> = {
  off: "bg-zinc-300",
  quiet: "bg-emerald-500",
  partial: "bg-amber-500",
  full: "bg-rose-500",
};

interface DayCell {
  date: Date;
  isWorking: boolean;
  booked: number;
  available: number;
  tier: CellTier;
}

/** إحصاء يوم واحد: محجوز مقابل متاح — لليوم المنقضي بالكامل تُحسب طاقته الأصلية (بدون قصّ على "الآن") */
function computeDayStats(date: Date, hours: WorkingHours, dayAppts: Appt[], now: Date) {
  const { start, end } = dayWorkWindow(date, hours);
  const booked = dayAppts.length;
  const referenceNow = end.getTime() <= now.getTime() ? start : now;
  const available = countAvailableSlotsForDay(date, hours, dayAppts, referenceNow);
  return { booked, available };
}

function tierOf(booked: number, available: number): CellTier {
  if (booked === 0) return "quiet";
  if (available === 0) return "full";
  return "partial";
}

function parseMonthParam(m: string | undefined): { year: number; month: number } {
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split("-").map(Number);
    if (mo >= 1 && mo <= 12) return { year: y, month: mo - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function monthParam(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function parseDayParam(d: string | undefined): Date | null {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const [y, m, day] = d.split("-").map(Number);
  const date = new Date(y, m - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dayParam(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function ScheduleRow({ row }: { row: Row }) {
  if (row.kind === "gap") {
    return (
      <tr className="border-t border-brand/10/80">
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
  const statusInfo = APPT_STATUS[row.appt.status] ?? { label: row.appt.status, color: "bg-zinc-100 text-foreground/65" };
  return (
    <tr className="border-t border-brand/10/80">
      <td className="p-3 font-bold text-zinc-800">
        {formatTime(row.appt.startsAt)} – {formatTime(row.appt.endsAt)}
      </td>
      <td className="p-3 text-foreground/75">{row.appt.customer.name}</td>
      <td className="p-3 text-foreground/65">{row.appt.service.name}</td>
      <td className="p-3 text-foreground/65">{formatSar(row.appt.depositAmount)}</td>
      <td className="p-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
      </td>
    </tr>
  );
}

export default async function StaffSchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { month: monthQ, day: dayQ } = await searchParams;

  const staff = await db.staff.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!staff) notFound();
  if (!canViewStaffSchedule(user, id)) notFound();

  const hours = parseWorkingHours(staff.workingHours);
  const { year, month } = parseMonthParam(monthQ);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const now = new Date();

  // نطاق أوسع بيوم: نوبة آخر يوم بالشهر قد تمتد لما بعد منتصف الليل
  const fetchStart = startOfDay(monthStart);
  const fetchEnd = endOfDay(new Date(monthEnd.getTime() + 24 * 60 * 60 * 1000));

  const appointments = await db.appointment.findMany({
    where: {
      tenantId: user.tenantId,
      staffId: id,
      startsAt: { gte: fetchStart, lte: fetchEnd },
      status: { not: "cancelled" },
    },
    include: { customer: true, service: true },
    orderBy: { startsAt: "asc" },
  });

  const daysInMonth = monthEnd.getDate();
  const cells: DayCell[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isWorking = hours.days.includes(date.getDay());
    if (!isWorking) {
      cells.push({ date, isWorking, booked: 0, available: 0, tier: "off" });
      continue;
    }
    const { start, end } = dayWorkWindow(date, hours);
    const dayAppts = appointments.filter((a) => a.startsAt >= start && a.startsAt < end);
    const { booked, available } = computeDayStats(date, hours, dayAppts, now);
    cells.push({ date, isWorking, booked, available, tier: tierOf(booked, available) });
  }

  const leadingBlanks = monthStart.getDay();
  const totalCells = leadingBlanks + daysInMonth;
  const trailingBlanks = (7 - (totalCells % 7)) % 7;

  const selectedDay = parseDayParam(dayQ);
  const inThisMonth = (d: Date) => d.getFullYear() === year && d.getMonth() === month;
  const activeDay = selectedDay && inThisMonth(selectedDay) ? selectedDay : inThisMonth(now) ? startOfDay(now) : null;

  let selectedRows: Row[] | null = null;
  let selectedStats: { booked: number; available: number } | null = null;
  if (activeDay) {
    const { start, end } = dayWorkWindow(activeDay, hours);
    const dayAppts = appointments.filter((a) => a.startsAt >= start && a.startsAt < end);
    selectedRows = buildDayTimeline(activeDay, hours, dayAppts);
    selectedStats = computeDayStats(activeDay, hours, dayAppts, now);
  }

  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);
  const baseHref = `/dashboard/staff/${id}/schedule`;

  return (
    <div>
      <Link href="/dashboard/staff" className="text-sm font-semibold text-brand hover:underline">
        ← رجوع للموظفات
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-brand-gold/25 bg-gradient-to-l from-brand/[0.04] to-brand-gold/[0.08] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-extrabold text-brand">
              جدول {staff.name}
              {staff.jobTitle && <span className="text-lg font-semibold text-foreground/55"> — {staff.jobTitle}</span>}
            </h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-foreground/55">
              <Clock className="h-3.5 w-3.5 text-brand-gold" />
              ساعات العمل {hours.start} – {hours.end}
            </p>
          </div>
          <ScheduleExportButton targetElementId="staff-schedule-table" fileName={`جدول-${staff.name}`} />
        </div>
      </div>

      <div id="staff-schedule-table" className="mt-6 space-y-4 bg-white">
        <div className="overflow-hidden rounded-2xl border border-brand/10 shadow-sm">
          <div className="flex items-center justify-between border-b border-brand/10 bg-background/60 px-4 py-3">
            <Link
              href={`${baseHref}?month=${monthParam(prevMonth.getFullYear(), prevMonth.getMonth())}`}
              className="rounded-full px-3 py-1.5 text-sm font-bold text-brand hover:bg-brand/5"
            >
              → الشهر السابق
            </Link>
            <span className="font-serif text-base font-extrabold text-zinc-800">
              {MONTH_NAMES[month]} {year}
            </span>
            <Link
              href={`${baseHref}?month=${monthParam(nextMonth.getFullYear(), nextMonth.getMonth())}`}
              className="rounded-full px-3 py-1.5 text-sm font-bold text-brand hover:bg-brand/5"
            >
              الشهر القادم ←
            </Link>
          </div>

          <div className="grid grid-cols-7 border-b border-brand/10 bg-background/40 text-center text-[11px] font-bold text-foreground/55">
            {DAY_NAMES.map((name, dow) => (
              <div key={dow} className="border-e border-brand/10 p-2 last:border-e-0">
                <div>{name}</div>
                <div className="mt-0.5 font-normal text-zinc-400">
                  {hours.days.includes(dow) ? `${hours.start}–${hours.end}` : "إجازة"}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`lead-${i}`} className="border-b border-e border-brand/10 bg-background/30 p-2 last:border-e-0" />
            ))}
            {cells.map((cell) => {
              const isSelected = Boolean(activeDay && dayParam(activeDay) === dayParam(cell.date));
              return (
                <Link
                  key={dayParam(cell.date)}
                  href={`${baseHref}?month=${monthParam(year, month)}&day=${dayParam(cell.date)}`}
                  className={`border-b border-e border-brand/10 p-2 text-start transition last:border-e-0 hover:bg-brand/5 ${
                    isSelected ? "bg-brand/10 ring-1 ring-inset ring-brand/40" : cell.isWorking ? "bg-white" : "bg-background/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${cell.isWorking ? "text-foreground/75" : "text-zinc-300"}`}>
                      {cell.date.getDate()}
                    </span>
                    <span className={`h-1.5 w-1.5 rounded-full ${TIER_DOT[cell.tier]}`} />
                  </div>
                  {cell.isWorking && (
                    <div className="mt-1 space-y-0.5 text-[10px] leading-tight text-foreground/55">
                      <div>{cell.booked} محجوز</div>
                      <div>{cell.available} متاح</div>
                    </div>
                  )}
                </Link>
              );
            })}
            {Array.from({ length: trailingBlanks }).map((_, i) => (
              <div key={`trail-${i}`} className="border-e border-brand/10 bg-background/30 p-2 last:border-e-0" />
            ))}
          </div>
        </div>

        {activeDay && selectedRows && selectedStats ? (
          <div className="overflow-hidden rounded-2xl border border-brand-gold/25 bg-white shadow-sm">
            <div className="flex items-center justify-between bg-gradient-to-l from-brand/[0.06] via-transparent to-brand-gold/[0.08] px-5 py-4">
              <span className="font-serif text-base font-bold text-zinc-800">{formatDay(activeDay)}</span>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {selectedStats.booked} محجوز
                </span>
                <span className="rounded-full bg-brand-gold/10 px-3 py-1 text-xs font-bold text-brand-gold">
                  {selectedStats.available} متاح
                </span>
              </div>
            </div>
            {selectedRows.length === 0 ? (
              <div className="p-8 text-center text-sm text-foreground/55">هذه الموظفة لا تعمل هذا اليوم.</div>
            ) : (
              <table className="w-full text-start text-sm">
                <thead className="bg-background/80 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th className="p-3 text-start">الوقت</th>
                    <th className="p-3 text-start">العميلة</th>
                    <th className="p-3 text-start">الخدمة</th>
                    <th className="p-3 text-start">العربون</th>
                    <th className="p-3 text-start">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRows.map((row, i) => (
                    <ScheduleRow key={row.kind === "appt" ? row.appt.id : `gap-${i}`} row={row} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-foreground/55">
            اختاري يومًا من الشبكة أعلاه لعرض تفاصيله.
          </div>
        )}
      </div>
    </div>
  );
}
