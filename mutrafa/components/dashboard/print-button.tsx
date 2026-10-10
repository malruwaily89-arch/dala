"use client";

import { btnGhost } from "../ui";

/** يفتح نافذة الطباعة؛ تنسيق الطباعة في globals.css يخفي القائمة الجانبية */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`${btnGhost} print:hidden`}
    >
      طباعة التقرير
    </button>
  );
}
