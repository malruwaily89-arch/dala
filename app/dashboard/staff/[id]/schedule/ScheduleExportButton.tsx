"use client";

import { useState } from "react";

export function ScheduleExportButton({
  targetElementId,
  fileName,
}: {
  targetElementId: string;
  fileName: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
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
      pdf.save(`${fileName}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={busy}
      className="rounded-full border border-brand/20 bg-brand/5 px-5 py-2.5 text-sm font-bold text-brand transition hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? "جارِ التصدير..." : "تصدير PDF"}
    </button>
  );
}
