"use client";

import { useState } from "react";
import type { getMonthlyReport, getAdvancedReport } from "@/app/actions/reports";

type MonthlyReport = Awaited<ReturnType<typeof getMonthlyReport>>;
type AdvancedReport = Awaited<ReturnType<typeof getAdvancedReport>>;

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
      const XLSX = await import("xlsx");

      const summarySheet = XLSX.utils.json_to_sheet([
        { المؤشر: "مواعيد مؤكدة", القيمة: report.confirmedCount },
        { المؤشر: "مواعيد مكتملة", القيمة: report.doneCount },
        { المؤشر: "مواعيد ملغاة", القيمة: report.cancelledCount },
        { المؤشر: "لم تحضر", القيمة: report.noShowCount },
        { المؤشر: "عربونات محصّلة", القيمة: report.collectedDeposits },
        { المؤشر: "عميلات جديدة هذا الشهر", القيمة: report.newCustomersCount },
        { المؤشر: "عربون من غير الحاضرات", القيمة: report.noShowDepositTotal },
        { المؤشر: "عربون من حجوزات مُعدَّلة", القيمة: report.rescheduledDepositTotal },
      ]);

      const servicesSheet = XLSX.utils.json_to_sheet(
        report.topServices.map((s) => ({ الخدمة: s.name, "عدد الحجوزات": s.count }))
      );

      const staffRows = report.topStaff.flatMap((s) =>
        s.services.map((svc) => ({
          الموظفة: s.name,
          "إجمالي مواعيد الموظفة": s.count,
          الخدمة: svc.name,
          "عدد حجوزات الخدمة": svc.count,
        }))
      );
      const staffSheet = XLSX.utils.json_to_sheet(staffRows);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, summarySheet, "ملخص التقرير");
      XLSX.utils.book_append_sheet(workbook, servicesSheet, "الخدمات");
      XLSX.utils.book_append_sheet(workbook, staffSheet, "الموظفات");

      if (advanced) {
        const advancedSheet = XLSX.utils.json_to_sheet([
          { المؤشر: "العربون المحصّل هذا الشهر", القيمة: advanced.currentCollected },
          { المؤشر: "العربون المحصّل الشهر السابق", القيمة: advanced.prevCollected },
          { المؤشر: "نسبة التغيّر", القيمة: `${advanced.revenueChangePercent.toFixed(1)}%` },
          { المؤشر: "أكثر يوم ازدحاماً", القيمة: advanced.busiestDayLabel ?? "—" },
          { المؤشر: "أكثر ساعة طلباً", القيمة: advanced.busiestHourLabel ?? "—" },
          { المؤشر: "معدل تحصيل العربون", القيمة: `${advanced.depositCollectionRate.toFixed(1)}%` },
          { المؤشر: "معدل الإلغاء", القيمة: `${advanced.cancellationRate.toFixed(1)}%` },
          { المؤشر: "معدل عدم الحضور", القيمة: `${advanced.noShowRate.toFixed(1)}%` },
        ]);
        XLSX.utils.book_append_sheet(workbook, advancedSheet, "تقارير متقدمة");
      }

      XLSX.writeFile(workbook, `تقرير-${monthLabel}.xlsx`);
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
