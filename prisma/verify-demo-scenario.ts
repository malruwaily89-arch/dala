import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { moneyToNumber } from "../lib/utils";

const db = new PrismaClient();
const SLUGS = ["noor-salon", "liyan-salon", "amal-salon"];

async function main() {
  const tenants = await db.tenant.findMany({
    where: { slug: { in: SLUGS } },
    include: { services: true, staff: true, customers: true },
    orderBy: { slug: "asc" },
  });
  if (!tenants.length) throw new Error("لا توجد صالونات السيناريو.");

  let totals = { staff: 0, customers: 0, services: 0, appointments: 0, done: 0, confirmed: 0, pending: 0, cancelled: 0, noShow: 0, paidDeposits: 0, doneRevenue: 0 };
  const problems: string[] = [];

  for (const tenant of tenants) {
    const appointments = await db.appointment.findMany({
      where: { tenantId: tenant.id },
      include: { service: true, staff: true, customer: true },
      orderBy: { startsAt: "asc" },
    });
    const counts = appointments.reduce<Record<string, number>>((m, a) => { m[a.status] = (m[a.status] ?? 0) + 1; return m; }, {});
    const paidDeposits = appointments.filter((a) => a.depositPaidAt).reduce((sum, a) => sum + moneyToNumber(a.depositAmount), 0);
    const doneRevenue = appointments.filter((a) => a.status === "done").reduce((sum, a) => sum + moneyToNumber(a.service.price), 0);

    // تحقق من عدم تداخل مواعيد الموظفة نفسها، حتى لو فصلت بينها مواعيد موظفات أخريات.
    const byStaff = new Map<string, typeof appointments>();
    for (const appointment of appointments) {
      const list = byStaff.get(appointment.staffId) ?? [];
      list.push(appointment);
      byStaff.set(appointment.staffId, list);
    }
    for (const staffAppointments of byStaff.values()) {
      staffAppointments.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
      for (let i = 1; i < staffAppointments.length; i++) {
        const previous = staffAppointments[i - 1];
        const current = staffAppointments[i];
        if (previous.startsAt < current.endsAt && current.startsAt < previous.endsAt) {
          problems.push(`${tenant.slug}: تداخل بين ${previous.bookingCode} و${current.bookingCode}`);
        }
      }
    }
    console.log(JSON.stringify({
      salon: tenant.slug,
      staff: tenant.staff.length,
      customers: tenant.customers.length,
      services: tenant.services.length,
      appointments: appointments.length,
      statuses: counts,
      paidDeposits: Number(paidDeposits.toFixed(2)),
      doneRevenue: Number(doneRevenue.toFixed(2)),
      attendanceRate: appointments.length ? Number((((counts.done ?? 0) + (counts.confirmed ?? 0)) / Math.max(1, appointments.length - (counts.cancelled ?? 0)) * 100).toFixed(2)) : 0,
    }, null, 2));

    totals.staff += tenant.staff.length;
    totals.customers += tenant.customers.length;
    totals.services += tenant.services.length;
    totals.appointments += appointments.length;
    totals.done += counts.done ?? 0;
    totals.confirmed += counts.confirmed ?? 0;
    totals.pending += counts.pending_deposit ?? 0;
    totals.cancelled += counts.cancelled ?? 0;
    totals.noShow += counts.no_show ?? 0;
    totals.paidDeposits += paidDeposits;
    totals.doneRevenue += doneRevenue;
  }

  if (totals.staff !== 10) problems.push(`إجمالي الموظفات المتوقع 10، الفعلي ${totals.staff}`);
  if (totals.customers !== 25) problems.push(`إجمالي العميلات المتوقع 25، الفعلي ${totals.customers}`);
  if (totals.services < 10) problems.push(`الخدمات يجب ألا تقل عن 10، الفعلي ${totals.services}`);
  if (totals.appointments !== 30) problems.push(`إجمالي المواعيد المتوقع 30، الفعلي ${totals.appointments}`);
  if (totals.done !== 12 || totals.confirmed !== 8 || totals.pending !== 3 || totals.cancelled !== 4 || totals.noShow !== 3) {
    problems.push("توزيع حالات المواعيد لا يطابق السيناريو المعتمد (12 مكتمل، 8 مؤكد، 3 عربون، 4 ملغي، 3 غياب).");
  }

  console.log(JSON.stringify({ totals: { ...totals, paidDeposits: Number(totals.paidDeposits.toFixed(2)), doneRevenue: Number(totals.doneRevenue.toFixed(2)) }, problems }, null, 2));
  if (problems.length) process.exitCode = 2;
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await db.$disconnect(); });
