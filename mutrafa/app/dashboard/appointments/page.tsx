import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { localDayBounds, localDayKey, formatLocalTime, formatLocalDate, addDays } from "@/lib/time";
import { APPOINTMENT_STATUS, SOURCE_LABEL } from "@/lib/labels";
import { formatSar } from "@/lib/money";
import { displayPhone } from "@/lib/phone";
import { createDashboardBookingAction } from "@/app/actions/appointments";
import { AppointmentActions } from "@/components/dashboard/appointment-actions";
import { Badge, Banner, Card, EmptyState, Field, PageHeader, PhoneField, btnPrimary, inputCls } from "@/components/ui";

export const metadata: Metadata = { title: "المواعيد" };

type Props = { searchParams: Promise<{ date?: string; error?: string; ok?: string; calendarId?: string; time?: string }> };

export default async function AppointmentsPage({ searchParams }: Props) {
  const { user, salon, ctx } = await requireDashboardUser();
  const { date, error, ok, calendarId: presetCalendar, time: presetTime } = await searchParams;
  const tz = salon.timezone;
  const dayKey = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : localDayKey(new Date(), tz);
  const { start, end } = localDayBounds(dayKey, tz);
  const canManage = canUse(user, ctx, "appointments.manage");

  const [appointments, services, calendars] = await Promise.all([
    db.appointment.findMany({
      where: { salonId: salon.id, startsAt: { gte: start, lt: end } },
      include: { customer: true, service: true, calendar: true },
      orderBy: { startsAt: "asc" },
    }),
    db.service.findMany({ where: { salonId: salon.id, isActive: true, kind: "STANDARD" }, orderBy: { name: "asc" } }),
    db.calendar.findMany({
      where: { salonId: salon.id, isActive: true },
      include: { services: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const anchor = new Date(`${dayKey}T12:00:00Z`);
  const prev = localDayKey(addDays(anchor, -1), "UTC");
  const next = localDayKey(addDays(anchor, 1), "UTC");

  return (
    <div>
      <PageHeader title="المواعيد" subtitle={formatLocalDate(start, tz)} />
      {error && <Banner>{error}</Banner>}
      {ok === "created" && <Banner tone="success">تم إنشاء الحجز.</Banner>}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={`/dashboard/appointments?date=${prev}`} className="rounded-full border px-4 py-2 text-sm font-bold">‹ اليوم السابق</Link>
        <form className="flex items-center gap-2">
          <input type="date" name="date" defaultValue={dayKey} className={`${inputCls} w-44`} />
          <button className={btnPrimary}>عرض</button>
        </form>
        <Link href={`/dashboard/appointments?date=${next}`} className="rounded-full border px-4 py-2 text-sm font-bold">اليوم التالي ›</Link>
      </div>

      {appointments.length === 0 ? (
        <EmptyState>لا مواعيد في هذا اليوم.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand/10 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-start text-sm">
            <thead className="bg-brand-soft/60 text-xs font-bold text-zinc-600">
              <tr>
                <th className="p-4 text-start">الوقت</th>
                <th className="p-4 text-start">العميلة</th>
                <th className="p-4 text-start">الخدمة / الموظفة</th>
                <th className="p-4 text-start">المصدر</th>
                <th className="p-4 text-start">الحالة</th>
                <th className="p-4 text-start">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => {
                const st = APPOINTMENT_STATUS[a.status];
                return (
                  <tr key={a.id} className="border-t border-zinc-100 align-top">
                    <td className="p-4 font-bold">{formatLocalTime(a.startsAt, tz)}</td>
                    <td className="p-4">
                      <p className="font-semibold">{a.customer.name}</p>
                      <p dir="ltr" className="text-xs text-zinc-500">{displayPhone(a.customer.phone)} · {a.code}</p>
                    </td>
                    <td className="p-4 text-zinc-700">{a.service.name}<br /><span className="text-xs text-zinc-500">{a.calendar.name}</span></td>
                    <td className="p-4 text-xs text-zinc-600">{SOURCE_LABEL[a.source]}</td>
                    <td className="p-4"><Badge className={st.tone}>{st.label}</Badge><p className="mt-1 text-xs text-zinc-500">عربون {formatSar(a.depositHalalas)}</p></td>
                    <td className="p-4">{canManage && <AppointmentActions id={a.id} status={a.status} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {canManage && (
        <Card className="mt-10">
          <h2 className="mb-4 font-bold text-ink">حجز جديد من لوحة التحكم</h2>
          {services.length === 0 || calendars.length === 0 ? (
            <p className="text-sm text-zinc-600">أضيفي خدمة وموظفة أولاً.</p>
          ) : (
            <form action={createDashboardBookingAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="اسم العميلة" name="customerName" required />
              <PhoneField name="customerPhone" label="الجوال" />
              <Field label="الخدمة">
                <select name="serviceId" required className={inputCls}>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="الموظفة">
                <select name="calendarId" required defaultValue={presetCalendar} className={inputCls}>
                  {calendars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="التاريخ" name="date" type="date" required defaultValue={dayKey} />
              <Field label="الوقت" name="time" type="time" required step={900} defaultValue={presetTime} />
              <div className="flex items-end md:col-span-2 xl:col-span-2">
                <button className={`${btnPrimary} w-full`}>إنشاء الحجز</button>
              </div>
            </form>
          )}
          <p className="mt-3 text-xs text-zinc-500">يمر الحجز بنفس فحوصات الحجز العام: ساعات العمل، والتعارض، والحد الشهري.</p>
        </Card>
      )}
    </div>
  );
}
