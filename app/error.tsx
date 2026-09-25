"use client";

import { useEffect } from "react";

/** حد خطأ محلي للصفحات — يعرض السبب ويحافظ على بقية التخطيط */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[دلال] خطأ في الصفحة:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <p className="text-3xl">⚠️</p>
        <h2 className="mt-3 text-lg font-extrabold">حدث خطأ في هذه الصفحة</h2>
        <pre
          dir="ltr"
          className="mt-4 rounded-lg bg-rose-50 p-3 text-start text-xs text-rose-700"
          style={{ whiteSpace: "pre-wrap" }}
        >
          {error.message}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
        <button
          onClick={reset}
          className="mt-5 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
