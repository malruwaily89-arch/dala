import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { buildReport, periodRange, type ReportPeriod } from "@/lib/report-data";
import { APPOINTMENT_STATUS, SOURCE_LABEL } from "@/lib/labels";
import { formatLocalDate, formatLocalTime, localDayKey } from "@/lib/time";
import { displayPhone } from "@/lib/phone";
import { hasFeature } from "@/lib/plans";

/** تصدير التقرير إلى ملف Excel: ملخص، يوم بيوم، الخدمات، الموظفات، وقائمة الحجوزات */
export async function GET(request: NextRequest) {
  const { user, salon, ctx } = await requireDashboardUser();
  if (!canUse(user, ctx, "reports.view")) return new NextResponse("غير مسموح", { status: 403 });

  const raw = request.nextUrl.searchParams.get("period");
  const period: ReportPeriod = raw === "last" || raw === "week" ? raw : "month";
  const tz = salon.timezone;
  const now = new Date();
  const data = await buildReport({ salonId: salon.id, timeZone: tz, period, quotaRemaining: ctx.remaining.monthlyBookings, now });
  const range = periodRange(period, now, tz);
  const sar = (halalas: number) => halalas / 100;
  const money = "#,##0.00";

  const wb = new ExcelJS.Workbook();
  wb.creator = "مُترَفة";
  wb.created = now;

  // ─── الملخص ───
  const summary = wb.addWorksheet("الملخص", { views: [{ rightToLeft: true }] });
  summary.columns = [{ width: 38 }, { width: 22 }];
  summary.addRow([`تقرير ${salon.name}`]).font = { bold: true, size: 14 };
  summary.addRow([`الفترة: ${formatLocalDate(range.from, tz)} — ${formatLocalDate(new Date(range.to.getTime() - 1), tz)}`]);
  summary.addRow([]);
  const header = (text: string) => {
    const row = summary.addRow([text]);
    row.font = { bold: true, color: { argb: "FFFFFFFF" } };
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF8A1538" } };
    row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF8A1538" } };
  };
  header("مؤشرات الفترة");
  const c = data.current;
  summary.addRow(["حجوزات جديدة", c.bookingsCreated]);
  summary.addRow(["مواعيد مكتملة", c.completed]);
  summary.addRow(["مواعيد مؤكدة (لم تُنفَّذ بعد)", c.confirmed]);
  summary.addRow(["لم تحضر", c.noShow]);
  summary.addRow(["ملغاة", c.cancelled]);
  summary.addRow(["إيراد الخدمات المكتملة (ر.س)", sar(c.serviceRevenueHalalas)]).getCell(2).numFmt = money;
  summary.addRow(["عربون محصّل (ر.س)", sar(c.depositsCollectedHalalas)]).getCell(2).numFmt = money;
  summary.addRow(["عربون من غير الحاضرات (ر.س)", sar(c.noShowDepositHalalas)]).getCell(2).numFmt = money;
  summary.addRow(["نسبة الإلغاء", c.cancellationRate]).getCell(2).numFmt = "0.0%";
  summary.addRow(["نسبة الغياب", c.noShowRate]).getCell(2).numFmt = "0.0%";
  summary.addRow(["نسبة تحصيل العربون", c.depositCollectionRate]).getCell(2).numFmt = "0.0%";
  summary.addRow([]);
  header("نظرة الشهر الحالي");
  summary.addRow(["حجوزات مؤكدة هذا الشهر", data.month.confirmed]);
  summary.addRow(["العائد المتوقع هذا الشهر (ر.س)", sar(data.month.expectedRevenueHalalas)]).getCell(2).numFmt = money;
  summary.addRow(["المواعيد المتاحة حتى نهاية الشهر", data.month.freeSlots]);
  summary.addRow(["الحجوزات المتبقية من حد الباقة", data.month.quotaRemaining]);

  // ─── يوم بيوم ───
  const daily = wb.addWorksheet("يوم بيوم", { views: [{ rightToLeft: true }] });
  daily.columns = [
    { header: "اليوم", key: "day", width: 14 },
    { header: "إجمالي الحجوزات", key: "count", width: 18 },
    { header: "مؤكد", key: "confirmed", width: 12 },
    { header: "مكتمل", key: "completed", width: 12 },
    { header: "لم تحضر", key: "noShow", width: 12 },
  ];
  data.daily.forEach((d) => daily.addRow(d));

  // ─── الخدمات ───
  const services = wb.addWorksheet("الخدمات", { views: [{ rightToLeft: true }] });
  services.columns = [
    { header: "الخدمة", key: "name", width: 30 },
    { header: "عدد الحجوزات", key: "count", width: 18 },
  ];
  c.topServices.forEach((s) => services.addRow(s));

  // ─── الموظفات ───
  const showCommission = hasFeature(ctx.entitlements, "commission");
  const staff = wb.addWorksheet("الموظفات", { views: [{ rightToLeft: true }] });
  staff.columns = [
    { header: "الموظفة", key: "name", width: 22 },
    { header: "مواعيد مكتملة", key: "completed", width: 16 },
    { header: "الإيراد (ر.س)", key: "revenue", width: 16 },
    ...(showCommission
      ? [
          { header: "نسبة العمولة %", key: "pct", width: 16 },
          { header: "مستحق العمولة (ر.س)", key: "commission", width: 20 },
        ]
      : []),
  ];
  data.staffRows.forEach((s) =>
    staff.addRow({
      name: s.name,
      completed: s.completed,
      revenue: sar(s.revenueHalalas),
      ...(showCommission ? { pct: s.commissionPercent, commission: sar(s.commissionHalalas) } : {}),
    })
  );
  staff.getColumn("revenue").numFmt = money;
  if (showCommission) staff.getColumn("commission").numFmt = money;

  // ─── قائمة الحجوزات ───
  const list = wb.addWorksheet("الحجوزات", { views: [{ rightToLeft: true }] });
  list.columns = [
    { header: "رقم الحجز", key: "code", width: 14 },
    { header: "اليوم", key: "day", width: 14 },
    { header: "الوقت", key: "time", width: 10 },
    { header: "العميلة", key: "customer", width: 22 },
    { header: "الجوال", key: "phone", width: 16 },
    { header: "الخدمة", key: "service", width: 24 },
    { header: "الموظفة", key: "staff", width: 16 },
    { header: "الحالة", key: "status", width: 16 },
    { header: "المصدر", key: "source", width: 14 },
    { header: "السعر (ر.س)", key: "price", width: 14 },
    { header: "العربون (ر.س)", key: "deposit", width: 14 },
  ];
  data.appointments.forEach((a) =>
    list.addRow({
      code: a.code,
      day: localDayKey(a.startsAt, tz),
      time: formatLocalTime(a.startsAt, tz),
      customer: a.customer.name,
      phone: displayPhone(a.customer.phone),
      service: a.service.name,
      staff: a.calendar.name,
      status: APPOINTMENT_STATUS[a.status]?.label ?? a.status,
      source: SOURCE_LABEL[a.source] ?? a.source,
      price: sar(a.priceHalalas),
      deposit: sar(a.depositHalalas),
    })
  );
  list.getColumn("price").numFmt = money;
  list.getColumn("deposit").numFmt = money;

  for (const ws of [daily, services, staff, list]) {
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF8A1538" } };
    ws.views = [{ state: "frozen", ySplit: 1, rightToLeft: true }];
  }

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `تقرير-${period}-${localDayKey(now, tz)}.xlsx`;
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
