import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireDashboardUser } from "@/lib/guard";
import { buildDayTimeline, type TimelineBooking } from "@/lib/timeline";
import { parseWorkingHours, computeAvailableSlots } from "@/lib/availability";
import { localDayBounds, localDayKey, addDays, formatLocalDate, formatLocalTime } from "@/lib/time";
import { APPOINTMENT_STATUS } from "@/lib/labels";
import { displayPhone } from "@/lib/phone";
import { Badge, Banner, Card, PageHeader, btnGhost } from "@/components/ui";

export const metadata: Metadata = { title: "جدول الموظفة" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ date?: string }> };

const ACTIVE = ["PENDING_DEPOSIT", "CONFIRMED", "COMPLETED", "NO_SHOW"] as const;

export default async function CalendarDayPage({ params, searchParams }: Props) {
  const { salon } = await requireDashboardUser();
  const { id } = await params;
  const { date } = await searchParams;
  const tz = salon.timezone;

  const calendar = await db.calendar.findFirst({
    where: { id, salonId: salon.id },
    include: { services: { include: { service: true } } },
  });
  if (!calendar) notFound();

  const now = new Date();
  const dayKey = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : localDayKey(now, tz);
  const { start, end } = localDayBounds(dayKey, tz);
  const hours = parseWorkingHours(calendar.workingHours);

  const appointments = await db.appointment.findMany({
    where: {
      calendarId: calendar.id,
      salonId: salon.id,
      status: { in: [...ACTIVE] },
      startsAt: { lt: end },
      endsAt: { gt: start },
    },
    include: { customer: true, service: true },
    orderBy: { startsAt: "asc" },
  });
  const bookings: TimelineBooking[] = appointments.map((a) => ({
    id: a.id,
    code: a.code,
    customerName: a.customer.name,
    customerPhone: a.customer.phone,
    serviceName: a.service.name,
    status: a.status,
    start: a.startsAt,
    end: a.endsAt,
  }));

  const rows = buildDayTimeline({ dayKey, timeZone: tz, hours, bookings, now });
  const minDuration = calendar.services.length ? Math.min(...calendar.services.map((s) => s.service.durationMinutes)) : 30;
  const freeStarts = computeAvailableSlots({
    dayKey,
    timeZone: tz,
    hours,
    durationMinutes: minDuration,
    busy: bookings.map((b) => ({ start: b.start, end: b.end })),
    now,
  });
  const workingDay = rows.length > 0;
  const bookedMinutes = bookings.reduce((sum, b) => sum + (b.end.getTime() - b.start.getTime()) / 60_000, 0);
  const workMinutes = rows.length * 15;
  const occupancy = workMinutes > 0 ? Math.round((bookedMinutes / workMinutes) * 100) : 0;

  const prev = localDayKey(addDays(new Date(`${dayKey}T12:00:00Z`), -1), "UTC");
  const next = localDayKey(addDays(new Date(`${dayKey}T12:00:00Z`), 1), "UTC");
  const dayLabel = formatLocalDate(start, tz);
  const serviceIds = calendar.services.map((s) => s.serviceId);

  return (
    <div>
      <PageHeader
        title={calendar.name}
        subtitle={`جدول ${dayLabel}${calendar.phone ? ` · ${displayPhone(calendar.phone)}` : ""}`}
        action={
          <Link href="/dashboard/calendars" className={btnGhost}>
            كل الموظفات
          </Link>
        }
      />

      {!workingDay && <Banner tone="info">هذه الموظفة في إجازة في هذا اليوم.</Banner>}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={`/dashboard/calendars/${calendar.id}?date=${prev}`} className={btnGhost}>‹ اليوم السابق</Link>
        <form className="flex items-center gap-2">
          <input type="date" name="date" defaultValue={dayKey} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm" />
          <button className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white">عرض</button>
        </form>
        <Link href={`/dashboard/calendars/${calendar.id}?date=${next}`} className={btnGhost}>اليوم التالي ›</Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold text-zinc-600">حجوزات اليوم</p>
          <p className="mt-1 font-serif text-2xl font-bold">{bookings.length}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-zinc-600">مواعيد متاحة (حسب أقصر خدمة)</p>
          <p className="mt-1 font-serif text-2xl font-bold text-emerald-700">{freeStarts.length}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-zinc-600">نسبة الإشغال</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-gradient-to-l from-gold to-brand" style={{ width: `${occupancy}%` }} />
          </div>
          <p className="mt-2 text-sm font-bold">{occupancy}%</p>
        </Card>
      </div>

      <Card className="p-0">
        <ul className="divide-y divide-zinc-100">
          {rows.map((row) => {
            const b = row.booking;
            const st = b ? APPOINTMENT_STATUS[b.status] : null;
            return (
              <li
                key={row.start.toISOString()}
                className={`flex flex-wrap items-center gap-4 px-5 py-3 ${row.status === "past" ? "bg-zinc-50/60 text-zinc-400" : ""}`}
              >
                <span className="w-16 font-serif text-lg font-bold">{row.label}</span>

                {row.status === "booked" && b && (
                  <div className="flex flex-1 flex-wrap items-center justify-between gap-3 rounded-xl border-s-4 border-brand bg-brand-soft/50 px-4 py-2.5">
                    <div>
                      <p className="font-bold">{b.customerName}</p>
                      <p className="text-xs text-zinc-600">
                        {b.serviceName} · {formatLocalTime(b.start, tz)} – {formatLocalTime(b.end, tz)} · {b.code}
                      </p>
                    </div>
                    {st && <Badge className={st.tone}>{st.label}</Badge>}
                  </div>
                )}

                {row.status === "booked" && !b && (
                  <span className="flex-1 text-sm text-zinc-400">ضمن حجز سابق</span>
                )}

                {row.status === "free" && (
                  <div className="flex flex-1 items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-emerald-700">متاح</span>
                    <Link
                      href={`/dashboard/appointments?date=${dayKey}&calendarId=${calendar.id}&time=${row.label}`}
                      className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                    >
                      احجزي هذا الوقت
                    </Link>
                  </div>
                )}

                {row.status === "past" && <span className="flex-1 text-sm">انتهى</span>}
              </li>
            );
          })}
        </ul>
      </Card>

      <p className="mt-4 text-xs text-zinc-500">
        الخدمات التي تقدمها: {calendar.services.map((s) => s.service.name).join("، ") || "لا توجد"} ({serviceIds.length})
      </p>
    </div>
  );
}
