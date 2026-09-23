import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { APPT_STATUS, formatDateTime } from "@/lib/utils";
import { EmptyState, Banner } from "../ui";
import {
  confirmDepositAction,
  completeAppointmentAction,
  cancelAppointmentAction,
  createAppointmentAdminAction,
  createCustomerAction,
} from "@/app/actions/appointments";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const user = await requireUser();
  const { error, ok } = await searchParams;

  const [appointments, customers, staff, services] = await Promise.all([
    db.appointment.findMany({
      where: { tenantId: user.tenantId },
      include: { customer: true, service: true, staff: true },
      orderBy: { startsAt: "desc" },
      take: 100,
    }),
    db.customer.findMany({ where: { tenantId: user.tenantId }, orderBy: { name: "asc" } }),
    db.staff.findMany({ where: { tenantId: user.tenantId, isActive: true } }),
    db.service.findMany({ where: { tenantId: user.tenantId, isActive: true } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold">المواعيد</h1>
      <p className="mt-1 text-sm text-zinc-500">كل الحجوزات — القادمة والسابقة.</p>

      {error && <Banner>{error}</Banner>}
      {ok && <Banner success>تم إنشاء الموعد بنجاح.</Banner>}

      {/* إنشاء موعد */}
      <details className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer font-bold text-brand">+ موعد جديد</summary>
        <form action={createAppointmentAdminAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Select name="customerId" label="العميلة" options={customers.map((c) => ({ v: c.id, l: `${c.name} (${c.phone})` }))} />
          <Select name="staffId" label="الموظفة" options={staff.map((s) => ({ v: s.id, l: s.name }))} />
          <Select name="serviceId" label="الخدمة" options={services.map((s) => ({ v: s.id, l: s.name }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input name="date" label="التاريخ" type="date" />
            <Input name="time" label="الوقت" type="time" />
          </div>
          <div className="sm:col-span-2">
            <button className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:opacity-90">
              إنشاء الموعد
            </button>
          </div>
        </form>
      </details>

      {appointments.length === 0 ? (
        <EmptyState text="لا مواعيد بعد." />
      ) : (
        <ul className="mt-4 space-y-3">
          {appointments.map((appt) => {
            const status = APPT_STATUS[appt.status] ?? { label: appt.status, color: "bg-zinc-100" };
            return (
              <li
                key={appt.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-52 flex-1">
                  <p className="font-bold">{formatDateTime(appt.startsAt)}</p>
                  <p className="text-sm text-zinc-600">
                    {appt.customer.name} · {appt.service.name} · {appt.staff.name} · {appt.bookingCode}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.color}`}>
                  {status.label}
                </span>
                {appt.status === "pending_deposit" && (
                  <form action={confirmDepositAction}>
                    <input type="hidden" name="id" value={appt.id} />
                    <MiniBtn className="bg-emerald-600 text-white">تأكيد العربون</MiniBtn>
                  </form>
                )}
                {appt.status === "confirmed" && (
                  <form action={completeAppointmentAction}>
                    <input type="hidden" name="id" value={appt.id} />
                    <MiniBtn className="bg-sky-600 text-white">مكتمل</MiniBtn>
                  </form>
                )}
                {(appt.status === "pending_deposit" || appt.status === "confirmed") && (
                  <form action={cancelAppointmentAction}>
                    <input type="hidden" name="id" value={appt.id} />
                    <MiniBtn className="border border-zinc-300 text-zinc-500">إلغاء</MiniBtn>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* إضافة عميلة سريعة */}
      <details className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer font-bold text-brand">+ عميلة جديدة</summary>
        <form action={createCustomerAction} className="mt-4 flex flex-wrap items-end gap-3">
          <Input name="name" label="الاسم" type="text" />
          <Input name="phone" label="الجوال" type="tel" />
          <button className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:opacity-90">
            حفظ
          </button>
        </form>
      </details>
    </div>
  );
}

function Input({ name, label, type }: { name: string; label: string; type: string }) {
  return (
    <label className="block flex-1">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        required
        dir={type === "tel" ? "ltr" : undefined}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
      />
    </label>
  );
}

function Select({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: { v: string; l: string }[];
}) {
  return (
    <label className="block flex-1">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <select
        name={name}
        required
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}

function MiniBtn({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <button className={`rounded-full px-4 py-2 text-xs font-bold transition hover:opacity-85 ${className}`}>
      {children}
    </button>
  );
}
