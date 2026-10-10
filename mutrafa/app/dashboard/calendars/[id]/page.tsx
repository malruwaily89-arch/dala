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
import { QuickBook } from "@/components/dashboard/quick-book";
import { updateCalendarServicesAction } from "@/app/actions/catalog";
import { inputCls, btnPrimary } from "@/components/ui";

export const metadata: Metadata = { title: "جدول الموظفة" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ date?: string; ok?: string; error?: string }> };

const ACTIVE = ["PENDING_DEPOSIT", "CONFIRMED", "COMPLETED", "NO_SHOW"] as const;

export default async function CalendarDayPage({ params, searchParams }: Props) {
  const { salon } = await requireDashboardUser();
  const { id } = await params;
  const { date, ok, error } = await searchParams;
  const tz = salon.timezone;

  const calendar = await db.calendar.findFirst({
    where: { id, salonId: salon.id },
    include: { services: { include: { service: true } } },
  });
  if (!calendar) notFound();
  const allServices = await db.service.findMany({ where: { salonId: salon.id, isActive: true }, orderBy: { name: "asc" } });
  const linked = new Map(calendar.services.map((cs) => [cs.serviceId, cs]));

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
  const effectiveDuration = (cs: { durationMinutes: number | null; service: { durationMinutes: number } }) =>
    cs.durationMinutes ?? cs.service.durationMinutes;
  const minDuration = calendar.services.length ? Math.min(...calendar.services.map(effectiveDuration)) : 30;
  const freeStarts = computeAvailableSlots({
    dayKey,
    timeZone: tz,
    hours,
    durationMinutes: minDuration,
    busy: bookings.map((b) => ({ start: b.start, end: b.end })),
    now,
  });
  const workingDay = rows.length > 0;
  // الخدمات التي تتسع فعلاً من كل خانة متاحة (لا تتجاوز الحجز التالي ولا نهاية الدوام)
  const workEndMs = rows.length ? rows[rows.length - 1].start.getTime() + 15 * 60_000 : 0;
  const activeServices = calendar.services
    .filter((cs) => cs.service.isActive)
    .map((cs) => ({ id: cs.service.id, name: cs.service.name, durationMinutes: effectiveDuration(cs) }));
  // طول الفترة الفارغة الحقيقي: من الخانة حتى الحجز التالي أو نهاية الدوام
  const gapMinutes = (startMs: number) => {
    const next = bookings.map((b) => b.start.getTime()).filter((t) => t > startMs).sort((a, b) => a - b)[0];
    return Math.round(((next ?? workEndMs) - startMs) / 60_000);
  };
  const fittingServices = (startMs: number) =>
    activeServices.filter((svc) => {
      const endMs = startMs + svc.durationMinutes * 60_000;
      return endMs <= workEndMs && !bookings.some((b) => startMs < b.end.getTime() && b.start.getTime() < endMs);
    });
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

      {ok === "booked" && <Banner tone="success">تم حفظ الحجز بنجاح ✅</Banner>}
      {ok === "services" && <Banner tone="success">تم حفظ خدمات الموظفة ومددها ✅</Banner>}
      {ok === "freeform" && <Banner tone="success">تم الحفظ في الجدول ✅</Banner>}
      {error && <Banner>{error}</Banner>}
      {!workingDay && <Banner tone="info">هذه الموظفة في إجازة في هذا اليوم.</Banner>}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={`/dashboard/calendars/${calendar.id}?date=${prev}`} className={btnGhost}>‹ اليوم السابق</Link>
        <form className="flex items-center gap-2">
          <input type="date" name="date" defaultValue={dayKey} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm" />
          <button className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white">عرض</button>
        </form>
        <Link href={`/dashboard/calendars/${calendar.id}?date=${next}`} className={btnGhost}>اليوم التالي ›</Link>
      </div>

      <details className="mb-8 rounded-2xl border border-brand/10 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer font-bold text-brand">الخدمات التي تقدمها ومدة كل خدمة</summary>
        <p className="mt-2 text-xs text-zinc-500">
          حددي الخدمات التي تقدمها هذه الموظفة، ومدة كل منها عندها. إن تركتِ المدة فارغة تُستخدم المدة الافتراضية للخدمة.
        </p>
        <form action={updateCalendarServicesAction} className="mt-4 space-y-3">
          <input type="hidden" name="calendarId" value={calendar.id} />
          {allServices.length === 0 && <p className="text-sm text-zinc-500">أضيفي خدمات أولاً من صفحة الخدمات.</p>}
          {allServices.map((svc) => {
            const link = linked.get(svc.id);
            return (
              <div key={svc.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-100 px-4 py-3">
                <label className="flex min-w-48 flex-1 items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name="serviceIds" value={svc.id} defaultChecked={Boolean(link)} className="h-4 w-4 accent-brand" />
                  {svc.name}
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-600">
                  المدة (دقيقة)
                  <input
                    name={`duration_${svc.id}`}
                    type="number"
                    min={15}
                    max={480}
                    step={5}
                    defaultValue={link?.durationMinutes ?? ""}
                    placeholder={String(svc.durationMinutes)}
                    className={`${inputCls} w-28`}
                  />
                </label>
              </div>
            );
          })}
          {allServices.length > 0 && <button className={btnPrimary}>حفظ الخدمات</button>}
        </form>
      </details>

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
                  <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
                    {fittingServices(row.start.getTime()).length > 0 ? (
                      <span className="text-sm font-semibold text-emerald-700">
                        متاح · فترة {gapMinutes(row.start.getTime())} دقيقة
                      </span>
                    ) : (
                      <span className="text-sm text-zinc-500">
                        فارغة {gapMinutes(row.start.getTime())} دقيقة · لا تكفي لخدمة مسجلة
                      </span>
                    )}
                    <QuickBook
                      calendarId={calendar.id}
                      calendarName={calendar.name}
                      dayLabel={dayLabel}
                      dayKey={dayKey}
                      time={row.label}
                      services={fittingServices(row.start.getTime())}
                      hasStandard={fittingServices(row.start.getTime()).length > 0}
                      gapMinutes={gapMinutes(row.start.getTime())}
                    />
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
