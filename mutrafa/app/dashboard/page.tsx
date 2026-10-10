import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { localDayBounds, localDayKey, formatLocalTime, weekdayOfDayKey, formatLocalDate } from "@/lib/time";
import { computeAvailableSlots, parseWorkingHours, type BusyInterval } from "@/lib/availability";
import { formatSar } from "@/lib/money";
import { displayPhone } from "@/lib/phone";
import { APPOINTMENT_STATUS, SOURCE_LABEL } from "@/lib/labels";
import { Badge, Banner, Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import { AppointmentActions } from "@/components/dashboard/appointment-actions";

export const metadata: Metadata = { title: "اليوم" };

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { user, salon, ctx } = await requireDashboardUser();
  const { welcome } = await searchParams;
  const tz = salon.timezone;
  const now = new Date();
  const dayKey = localDayKey(now, tz);
  const { start, end } = localDayBounds(dayKey, tz);
  const canManage = canUse(user, ctx, "appointments.manage");

  const [appointments, calendars, services] = await Promise.all([
    db.appointment.findMany({
      where: { salonId: salon.id, startsAt: { gte: start, lt: end }, status: { notIn: ["CANCELLED", "EXPIRED"] } },
      include: { customer: true, service: true, calendar: true },
      orderBy: { startsAt: "asc" },
    }),
    db.calendar.findMany({ where: { salonId: salon.id, isActive: true }, orderBy: { createdAt: "asc" } }),
    db.service.findMany({ where: { salonId: salon.id, isActive: true }, select: { durationMinutes: true } }),
  ]);

  const confirmed = appointments.filter((a) => a.status === "CONFIRMED").length;
  const pending = appointments.filter((a) => a.status === "PENDING_DEPOSIT").length;
  const done = appointments.filter((a) => a.status === "COMPLETED").length;
  const minDuration = services.length ? Math.min(...services.map((s) => s.durationMinutes)) : 30;

  // إشغال الموظفات اليوم: الدقائق المحجوزة / دقائق العمل
  const occupancy = calendars.map((c) => {
    const hours = parseWorkingHours(c.workingHours);
    const dow = weekdayOfDayKey(dayKey);
    const working = hours.days.includes(dow);
    const [sh, sm] = hours.start.split(":").map(Number);
    const [eh, em] = hours.end.split(":").map(Number);
    const workMinutes = working ? eh * 60 + em - (sh * 60 + sm) : 0;
    const busy: BusyInterval[] = appointments
      .filter((a) => a.calendarId === c.id && a.status !== "COMPLETED" && a.status !== "NO_SHOW")
      .map((a) => ({ start: a.startsAt, end: a.endsAt }));
    const bookedMinutes = busy.reduce((sum, b) => sum + (b.end.getTime() - b.start.getTime()) / 60_000, 0);
    const slots = working
      ? computeAvailableSlots({ dayKey, timeZone: tz, hours, durationMinutes: minDuration, busy, now })
      : [];
    return {
      id: c.id,
      name: c.name,
      working,
      percent: workMinutes > 0 ? Math.min(100, Math.round((bookedMinutes / workMinutes) * 100)) : 0,
      freeSlots: slots.length,
      nextFree: slots[0] ? formatLocalTime(slots[0], tz) : null,
    };
  });

  const usage = ctx.entitlements.monthlyBookings;
  const totalFree = occupancy.reduce((sum, o) => sum + o.freeSlots, 0);

  return (
    <div>
      <PageHeader title="اليوم" subtitle={formatLocalDate(now, tz)} />
      {welcome === "1" && (
        <Banner tone="success">أهلاً بك في مُترَفة 🌸 ابدئي بإضافة خدماتك ثم موظفاتك، وشاركي رابط حجزك مع عميلاتك.</Banner>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="مواعيد متاحة اليوم" value={String(totalFree)} note="لكامل الصالون (حسب أقصر خدمة)" />
        <Stat label="مواعيد اليوم" value={String(appointments.length)} />
        <Stat label="مؤكدة" value={String(confirmed)} note={`${done} مكتملة`} />
        <Stat label="بانتظار العربون" value={String(pending)} />
        <Stat label="حجوزات الشهر" value={`${ctx.usage.monthlyBookings} من ${usage}`} note={`متبقٍ ${ctx.remaining.monthlyBookings} حجز هذا الشهر`} />
      </div>

      <h2 className="mb-3 mt-10 text-lg font-bold text-ink">إشغال الموظفات والمواعيد الفارغة</h2>
      {occupancy.length === 0 ? (
        <EmptyState>لا توجد موظفات نشطات بعد.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {occupancy.map((o) => (
            <Card key={o.id}>
              <div className="flex items-center justify-between">
                <Link href={`/dashboard/calendars/${o.id}`} className="font-bold text-brand hover:underline">{o.name}</Link>
                {!o.working && <Badge className="bg-zinc-100 text-zinc-600">إجازة اليوم</Badge>}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-gradient-to-l from-gold to-brand" style={{ width: `${o.percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-zinc-600">
                الإشغال {o.percent}% · مواعيد متاحة: {o.freeSlots}
                {o.nextFree && ` · أقرب موعد فارغ ${o.nextFree}`}
              </p>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-10 text-lg font-bold text-ink">جدول اليوم</h2>
      {appointments.length === 0 ? (
        <EmptyState>لا مواعيد اليوم بعد. شاركي رابط صالونك: <span dir="ltr" className="font-bold">{`mutrafa.d-alal.com/${salon.slug}`}</span></EmptyState>
      ) : (
        <ul className="space-y-3">
          {appointments.map((a) => {
            const st = APPOINTMENT_STATUS[a.status];
            return (
              <li key={a.id}>
                <Card className="flex flex-wrap items-center gap-4">
                  <div className="min-w-20 text-center">
                    <p className="font-serif text-xl font-bold text-brand">{formatLocalTime(a.startsAt, tz)}</p>
                    <p className="text-xs text-zinc-500">{a.calendar.name}</p>
                  </div>
                  <div className="min-w-48 flex-1">
                    <p className="font-bold">{a.customer.name} <span dir="ltr" className="text-xs font-normal text-zinc-500">{displayPhone(a.customer.phone)}</span></p>
                    <p className="text-sm text-zinc-600">{a.service.name} · {SOURCE_LABEL[a.source]} · {a.code}</p>
                  </div>
                  <Badge className={st.tone}>{st.label}</Badge>
                  <span className="text-sm text-zinc-600">عربون {formatSar(a.depositHalalas)}</span>
                  {canManage && <AppointmentActions id={a.id} status={a.status} />}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
