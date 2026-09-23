"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
    >
      🖨️ طباعة / حفظ PDF
    </button>
  );
}
