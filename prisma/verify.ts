import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";

const db = new PrismaClient();

/**
 * سكربت تحقق حسابي مستقل — يستعلم قاعدة البيانات مباشرة ويحسب كل معادلة
 * يدوياً، ثم يقارنها بمنطق التقارير في app/actions/reports.ts (للشهر الحالي).
 * يعمل على أي قاعدة (SQLite محلياً / PostgreSQL على Vercel) لأن الحسابات محايدة للنوع.
 */

function sar(n: number): string {
  return `${n.toLocaleString("ar-SA")} ر.س`;
}

async function main() {
  const tenants = await db.tenant.findMany({
    where: { slug: { not: "dalal-platform" } },
    orderBy: { slug: "asc" },
  });

  for (const t of tenants) {
    const appts = await db.appointment.findMany({
      where: { tenantId: t.id },
      include: { service: true, staff: true },
    });

    const total = appts.length;
    const done = appts.filter((a) => a.status === "done");
    const confirmed = appts.filter((a) => a.status === "confirmed");
    const cancelled = appts.filter((a) => a.status === "cancelled");
    const noShow = appts.filter((a) => a.status === "no_show");
    const pending = appts.filter((a) => a.status === "pending_deposit");

    // أ. إيرادات = مجموع أسعار الخدمات للحجوزات المكتملة (done)
    const doneRevenue = done.reduce((s, a) => s + a.service.price, 0);

    // ب. معدل الحضور = (done + confirmed) / (total - cancelled) × 100
    const denom = total - cancelled.length;
    const attendanceRate = denom > 0 ? ((done.length + confirmed.length) / denom) * 100 : 0;

    // ج. عربون الغائبات = مجموع deposits لحجوزات no_show فقط
    const noShowDeposits = noShow.reduce((s, a) => s + a.depositAmount, 0);
    const cancelledDeposits = cancelled.reduce((s, a) => s + a.depositAmount, 0);

    // د. ترتيب الخدمات الأكثر شعبية (استبعاد الملغيات)
    const serviceCounts = new Map<string, number>();
    for (const a of appts) {
      if (a.status === "cancelled") continue;
      serviceCounts.set(a.service.name, (serviceCounts.get(a.service.name) ?? 0) + 1);
    }
    const rankedServices = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1]);

    // هـ. إيراد كل موظفة = مجموع أسعار الحجوزات المكتملة (done فقط)
    const staffRevenue = new Map<string, number>();
    for (const a of done) {
      staffRevenue.set(a.staff.name, (staffRevenue.get(a.staff.name) ?? 0) + a.service.price);
    }
    const rankedStaff = [...staffRevenue.entries()].sort((a, b) => b[1] - a[1]);
    const confirmedRevenue = confirmed.reduce((s, a) => s + a.service.price, 0);

    console.log(`\n===== ${t.name} (${t.slug}) — ${t.plan} =====`);
    console.log(`الحالات: total=${total} done=${done.length} confirmed=${confirmed.length} cancelled=${cancelled.length} no_show=${noShow.length} pending_deposit=${pending.length}`);
    console.log(`أ. إيراد الخدمات المكتملة (done): ${sar(doneRevenue)}`);
    console.log(`ب. معدل الحضور = (${done.length}+${confirmed.length})/(${total}-${cancelled.length}) × 100 = ${attendanceRate.toFixed(2)}%`);
    console.log(`ج. عربون الغائبات (no_show فقط): ${sar(noShowDeposits)} | عربون الملغيات (يجب استبعاده): ${sar(cancelledDeposits)}`);
    console.log("د. ترتيب الخدمات (بدون الملغيات): " + rankedServices.map(([n, c]) => `${n}=${c}`).join("، "));
    console.log("هـ. إيراد الموظفات (done فقط): " + rankedStaff.map(([n, v]) => `${n}=${sar(v)}`).join(" | "));
    console.log(`   (تأكيد الفصل) إيراد الحجوزات المؤكدة فقط (confirmed، لا يُحسب): ${sar(confirmedRevenue)}`);
  }

  // ===== مقارنة بمنطق التقارير (app/actions/reports.ts) — الشهر الحالي لصالون نور =====
  const noor = await db.tenant.findUnique({ where: { slug: "noor-salon" } });
  if (noor) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthAppts = await db.appointment.findMany({
      where: { tenantId: noor.id, startsAt: { gte: monthStart, lte: monthEnd } },
      include: { service: true, staff: true },
    });

    // نفس منطق getMonthlyReport
    const collectedDeposits = monthAppts
      .filter((a) => a.depositPaidAt)
      .reduce((s, a) => s + a.depositAmount, 0);
    const noShowDepositAppts = monthAppts.filter((a) => a.status === "no_show" && a.depositPaidAt);
    const noShowDepositTotal = noShowDepositAppts.reduce((s, a) => s + a.depositAmount, 0);
    const active = monthAppts.filter((a) => a.status !== "cancelled");
    const svcCounts = new Map<string, number>();
    for (const a of active) svcCounts.set(a.service.name, (svcCounts.get(a.service.name) ?? 0) + 1);
    const topServices = [...svcCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const staffCounts = new Map<string, number>();
    for (const a of active) staffCounts.set(a.staff.name, (staffCounts.get(a.staff.name) ?? 0) + 1);
    const topStaff = [...staffCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

    const monthLabel = now.toLocaleDateString("ar-SA", { month: "long", year: "numeric" });
    console.log(`\n===== مقارنة منطق التقارير (الشهر الحالي: ${monthLabel}) — صالون نور =====`);
    console.log(`عدد مواعيد الشهر الحالي: ${monthAppts.length}`);
    console.log(`عربونات محصّلة (collectedDeposits): ${sar(collectedDeposits)}`);
    console.log(`عربون غير الحاضرات (no_show + depositPaidAt): ${sar(noShowDepositTotal)} من ${noShowDepositAppts.length} حالة`);
    console.log("topServices: " + topServices.map(([n, c]) => `${n}=${c}`).join("، "));
    console.log("topStaff: " + topStaff.map(([n, c]) => `${n}=${c}`).join("، "));
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
