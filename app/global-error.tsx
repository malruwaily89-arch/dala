"use client";

import { useEffect } from "react";

/**
 * حد الخطأ العام — يعرض السبب الحقيقي بدل الصفحة العامة المبهمة.
 * يُفعَّل عند أي استثناء غير مُلتقط في شجرة React.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[سيدة] خطأ غير ملتقط:", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#fafaf9",
          color: "#27272a",
        }}
      >
        <div style={{ maxWidth: 480, padding: 32, textAlign: "center" }}>
          <p style={{ fontSize: 40, margin: 0 }}>⚠️</p>
          <h1 style={{ fontSize: 20, marginTop: 8 }}>حدث خطأ غير متوقع</h1>
          <pre
            dir="ltr"
            style={{
              marginTop: 16,
              padding: 12,
              background: "#fef2f2",
              color: "#b91c1c",
              borderRadius: 8,
              fontSize: 12,
              whiteSpace: "pre-wrap",
              textAlign: "left",
            }}
          >
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "10px 24px",
              borderRadius: 999,
              border: "none",
              background: "#9d174d",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
