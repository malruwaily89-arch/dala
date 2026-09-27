"use client";

import { useState } from "react";
import type { getMonthlyReport, getAdvancedReport } from "@/app/actions/reports";

type MonthlyReport = Awaited<ReturnType<typeof getMonthlyReport>>;
type AdvancedReport = Awaited<ReturnType<typeof getAdvancedReport>>;

function downloadBlob(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ReportExportButtons({
  report,
  advanced,
  monthLabel,
  targetElementId,
}: {
  report: MonthlyReport;
  advanced: AdvancedReport | null;
  monthLabel: string;
  targetElementId: string;
}) {
  const [busy, setBusy] = useState<"excel" | "pdf" | null>(null);

  async function handleExportExcel() {
    setBusy("excel");
    try {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();

      function addKeyValueSheet(name: string, rows: { المؤشر: string; القيمة: string | number }[]) {
        const sheet = workbook.addWorksheet(name);
        sheet.columns = [
          { header: "المؤشر", key: "k", width: 32 },
          { header: "القيمة", key: "v", width: 22 },
        ];
        sheet.addRows(rows.map((r) => ({ k: r.المؤشر, v: r.القيمة })));
      }

      addKeyValueSheet("ملخص التقرير", [
        { المؤشر: "مواعيد مؤكدة", القيمة: report.confirmedCount },
        { المؤشر: "مواعيد مكتملة", القيمة: report.doneCount },
        { المؤشر: "مواعيد ملغاة", القيمة: report.cancelledCount },
        { المؤشر: "لم تحضر", القيمة: report.noShowCount },
        { المؤشر: "عربونات محصّلة", القيمة: report.collectedDeposits },
        { المؤشر: "عميلات جديدة هذا الشهر", القيمة: report.newCustomersCount },
        { المؤشر: "عربون من غير الحاضرات", القيمة: report.noShowDepositTotal },
        { المؤشر: "عربون من حجوزات مُعدَّلة", القيمة: report.rescheduledDepositTotal },
      ]);

      const servicesSheet = workbook.addWorksheet("الخدمات");
      servicesSheet.columns = [
        { header: "الخدمة", key: "name", width: 30 },
        { header: "عدد الحجوزات", key: "count", width: 18 },
      ];
      servicesSheet.addRows(report.topServices.map((s) => ({ name: s.name, count: s.count })));

      const staffSheet = workbook.addWorksheet("الموظفات");
      staffSheet.columns = [
        { header: "الموظفة", key: "staff", width: 22 },
        { header: "إجمالي مواعيد الموظفة", key: "staffTotal", width: 22 },
        { header: "الخدمة", key: "service", width: 22 },
        { header: "عدد حجوزات الخدمة", key: "serviceCount", width: 20 },
      ];
      staffSheet.addRows(
        report.topStaff.flatMap((s) =>
          s.services.map((svc) => ({
            staff: s.name,
            staffTotal: s.count,
            service: svc.name,
            serviceCount: svc.count,
          }))
        )
      );

      if (advanced) {
        addKeyValueSheet("تقارير متقدمة", [
          { المؤشر: "العربون المحصّل هذا الشهر", القيمة: advanced.currentCollected },
          { المؤشر: "العربون المحصّل الشهر السابق", القيمة: advanced.prevCollected },
          { المؤشر: "نسبة التغيّر", القيمة: `${advanced.revenueChangePercent.toFixed(1)}%` },
          { المؤشر: "أكثر يوم ازدحاماً", القيمة: advanced.busiestDayLabel ?? "—" },
          { المؤشر: "أكثر ساعة طلباً", القيمة: advanced.busiestHourLabel ?? "—" },
          { المؤشر: "معدل تحصيل العربون", القيمة: `${advanced.depositCollectionRate.toFixed(1)}%` },
          { المؤشر: "معدل الإلغاء", القيمة: `${advanced.cancellationRate.toFixed(1)}%` },
          { المؤشر: "معدل عدم الحضور", القيمة: `${advanced.noShowRate.toFixed(1)}%` },
        ]);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      downloadBlob(buffer as ArrayBuffer, `تقرير-${monthLabel}.xlsx`);
    } finally {
      setBusy(null);
    }
  }

  async function handleExportPdf() {
    setBusy("pdf");
    try {
      const element = document.getElementById(targetElementId);
      if (!element) return;

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`تقرير-${monthLabel}.pdf`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleExportExcel}
        disabled={busy !== null}
        className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy === "excel" ? "جارِ التصدير..." : "تصدير Excel"}
      </button>
      <button
        type="button"
        onClick={handleExportPdf}
        disabled={busy !== null}
        className="rounded-full border border-purple-200 bg-purple-50 px-5 py-2.5 text-sm font-bold text-purple-800 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy === "pdf" ? "جارِ التصدير..." : "تصدير PDF"}
      </button>
    </div>
  );
}
