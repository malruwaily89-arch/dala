"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/** بيانات تقرير الشهر الحالي المبسّط للوحة صاحبة الصالون */
export async function getMonthlyReport() {
  const user = await requireUser();
  const tenantId = user.tenantId;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const appointments = await db.appointment.findMany({
    where: { tenantId, startsAt: { gte: monthStart, lte: monthEnd } },
    include: { service: true, staff: true },
  });

  // ملاحظة: "مؤكدة" و"مكتملة" حالتان منفصلتان (لا تُجمعان في رقم واحد)
  // كي لا يختلط على مالكة الصالون عدد المواعيد التي أُنجزت فعلاً بعدد التي لا تزال قادمة.
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const doneCount = appointments.filter((a) => a.status === "done").length;
  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;
  const noShowCount = appointments.filter((a) => a.status === "no_show").length;

  const collectedDeposits = appointments
    .filter((a) => a.depositPaidAt)
    .reduce((sum, a) => sum + a.depositAmount, 0);

  const newCustomersCount = await db.customer.count({
    where: { tenantId, createdAt: { gte: monthStart, lte: monthEnd } },
  });

  // الحجوزات الملغاة لم تحدث فعلياً — تُستثنى من "الأكثر طلباً" و"الأكثر انشغالاً"
  const activeAppointments = appointments.filter((a) => a.status !== "cancelled");

  // أكثر الخدمات طلباً
  const serviceCounts = new Map<string, { name: string; count: number }>();
  for (const a of activeAppointments) {
    const entry = serviceCounts.get(a.serviceId) ?? { name: a.service.name, count: 0 };
    entry.count += 1;
    serviceCounts.set(a.serviceId, entry);
  }
  const topServices = [...serviceCounts.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  // أكثر الموظفات انشغالاً + تفصيل خدمات كل موظفة
  const staffCounts = new Map<
    string,
    { name: string; count: number; services: Map<string, { name: string; count: number }> }
  >();
  for (const a of activeAppointments) {
    const entry =
      staffCounts.get(a.staffId) ?? { name: a.staff.name, count: 0, services: new Map<string, { name: string; count: number }>() };
    entry.count += 1;
    const serviceEntry = entry.services.get(a.serviceId) ?? { name: a.service.name, count: 0 };
    serviceEntry.count += 1;
    entry.services.set(a.serviceId, serviceEntry);
    staffCounts.set(a.staffId, entry);
  }
  const topStaff = [...staffCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((s) => ({
      name: s.name,
      count: s.count,
      services: [...s.services.values()].sort((a, b) => b.count - a.count),
    }));

  // عربون محصّل من غير الحاضرات (no-show) — ربح صافٍ لا يُعاد
  const noShowDepositAppointments = appointments.filter(
    (a) => a.status === "no_show" && a.depositPaidAt
  );
  const noShowDepositCount = noShowDepositAppointments.length;
  const noShowDepositTotal = noShowDepositAppointments.reduce((sum, a) => sum + a.depositAmount, 0);

  // عربون محصّل من حجوزات مُعدَّلة (تم تغيير الموعد)
  const rescheduledDepositAppointments = appointments.filter(
    (a) => a.rescheduledAt && a.depositPaidAt
  );
  const rescheduledDepositCount = rescheduledDepositAppointments.length;
  const rescheduledDepositTotal = rescheduledDepositAppointments.reduce(
    (sum, a) => sum + a.depositAmount,
    0
  );

  return {
    confirmedCount,
    doneCount,
    cancelledCount,
    noShowCount,
    collectedDeposits,
    newCustomersCount,
    topServices,
    topStaff,
    noShowDepositCount,
    noShowDepositTotal,
    rescheduledDepositCount,
    rescheduledDepositTotal,
  };
}

/** تقرير متقدم (باقات برو فقط): مقارنة شهرية، ذروة الأيام والساعات، نسب التحصيل والإلغاء */
export async function getAdvancedReport() {
  const user = await requireUser();
  const tenantId = user.tenantId;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [currentAppointments, prevAppointments] = await Promise.all([
    db.appointment.findMany({ where: { tenantId, startsAt: { gte: monthStart, lte: monthEnd } } }),
    db.appointment.findMany({
      where: { tenantId, startsAt: { gte: prevMonthStart, lte: prevMonthEnd } },
    }),
  ]);

  // مقارنة العربون المحصّل مع الشهر السابق
  const currentCollected = currentAppointments
    .filter((a) => a.depositPaidAt)
    .reduce((sum, a) => sum + a.depositAmount, 0);
  const prevCollected = prevAppointments
    .filter((a) => a.depositPaidAt)
    .reduce((sum, a) => sum + a.depositAmount, 0);
  const revenueChangePercent =
    prevCollected > 0
      ? ((currentCollected - prevCollected) / prevCollected) * 100
      : currentCollected > 0
        ? 100
        : 0;

  // أكثر أيام الأسبوع ازدحاماً (باستثناء الملغاة)
  const DAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const activeCurrent = currentAppointments.filter((a) => a.status !== "cancelled");
  const dayCounts = new Map<number, number>();
  const hourCounts = new Map<number, number>();
  for (const a of activeCurrent) {
    const day = a.startsAt.getDay();
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    const hour = a.startsAt.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  }
  const busiestDayEntry = [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const busiestHourEntry = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  // معدل تحصيل العربون ومعدلات الإلغاء وعدم الحضور
  const totalCount = currentAppointments.length;
  const depositPaidCount = currentAppointments.filter((a) => a.depositPaidAt).length;
  const cancelledCount = currentAppointments.filter((a) => a.status === "cancelled").length;
  const noShowCount = currentAppointments.filter((a) => a.status === "no_show").length;

  const depositCollectionRate = totalCount > 0 ? (depositPaidCount / totalCount) * 100 : 0;
  const cancellationRate = totalCount > 0 ? (cancelledCount / totalCount) * 100 : 0;
  const noShowRate = totalCount > 0 ? (noShowCount / totalCount) * 100 : 0;

  return {
    currentCollected,
    prevCollected,
    revenueChangePercent,
    busiestDayLabel: busiestDayEntry ? DAY_NAMES[busiestDayEntry[0]] : null,
    busiestDayCount: busiestDayEntry ? busiestDayEntry[1] : 0,
    busiestHourLabel: busiestHourEntry ? `${String(busiestHourEntry[0]).padStart(2, "0")}:00` : null,
    busiestHourCount: busiestHourEntry ? busiestHourEntry[1] : 0,
    depositCollectionRate,
    cancellationRate,
    noShowRate,
  };
}

/** أداء كل موظفة: عدد المواعيد ومجموع العربونات المحصّلة (اليوم + الشهر) */
export async function getStaffPerformanceReport() {
  const user = await requireUser();
  const tenantId = user.tenantId;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [staffList, appointments] = await Promise.all([
    db.staff.findMany({ where: { tenantId }, orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
    db.appointment.findMany({
      where: { tenantId, startsAt: { gte: monthStart, lte: monthEnd }, status: { not: "cancelled" } },
    }),
  ]);

  const byStaff = new Map<string, typeof appointments>();
  for (const a of appointments) {
    const list = byStaff.get(a.staffId) ?? [];
    list.push(a);
    byStaff.set(a.staffId, list);
  }

  // متوسط عدد المواعيد هذا الشهر بين كل الموظفات — أساس تحديد مستوى الأداء
  const staffWithAppts = staffList.filter((s) => (byStaff.get(s.id)?.length ?? 0) > 0 || s.isActive);
  const avgMonthCount =
    staffWithAppts.length > 0
      ? appointments.length / staffWithAppts.length
      : 0;

  const rows = staffList.map((s) => {
    const monthAppts = byStaff.get(s.id) ?? [];
    const todayAppts = monthAppts.filter((a) => a.startsAt >= todayStart && a.startsAt <= todayEnd);
    const monthCount = monthAppts.length;
    const todayCount = todayAppts.length;

    const paidTodayAppts = todayAppts.filter((a) => a.depositPaidAt);
    const collectedToday = paidTodayAppts.reduce((sum, a) => sum + a.depositAmount, 0);

    const priorDaysAppts = monthAppts.filter(
      (a) => a.depositPaidAt && !(a.startsAt >= todayStart && a.startsAt <= todayEnd)
    );
    const collectedPriorDays = priorDaysAppts.reduce((sum, a) => sum + a.depositAmount, 0);
    const collectedMonthTotal = collectedToday + collectedPriorDays;

    let performanceLevel: "busy" | "active" | "quiet" = "quiet";
    if (avgMonthCount > 0) {
      if (monthCount >= avgMonthCount * 1.5) performanceLevel = "busy";
      else if (monthCount >= avgMonthCount * 0.7) performanceLevel = "active";
      else performanceLevel = "quiet";
    } else if (monthCount > 0) {
      performanceLevel = "active";
    }

    return {
      id: s.id,
      name: s.name,
      isActive: s.isActive,
      todayCount,
      monthCount,
      collectedToday,
      collectedPriorDays,
      collectedMonthTotal,
      performanceLevel,
    };
  });

  return { rows, avgMonthCount };
}
