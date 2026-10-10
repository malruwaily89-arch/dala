"use client";

/** يفتح نافذة الطباعة؛ تنسيق الطباعة في globals.css يخفي القائمة الجانبية */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center rounded-full border border-brand/25 bg-white px-5 py-2.5 text-sm font-bold text-brand transition hover:bg-brand-soft print:hidden"
    >
      طباعة التقرير
    </button>
  );
}
